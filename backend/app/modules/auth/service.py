import hashlib
import uuid
from typing import Optional

import httpx
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
    UnauthorizedError,
    ValidationError,
)
from app.core.redis import get_redis
from app.core.security import (
    create_access_token,
    create_email_verify_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_password,
    verify_password,
)
from app.modules.users.models import User
from app.modules.users.service import get_user_by_email, get_user_by_phone
from app.modules.wallet.models import Wallet


async def _send_otp_sms(phone: str, otp: str) -> None:
    """Send OTP via telcosms.co.ao."""
    if not settings.TELCOSMS_API_KEY:
        logger.warning(f"TelcoSMS not configured. OTP for {phone}: {otp}")
        return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                settings.TELCOSMS_URL,
                json={
                    "message": {
                        "api_key_app": settings.TELCOSMS_API_KEY,
                        "phone_number": phone,
                        "message_body": f"Your StrongX verification code is: {otp}",
                    }
                },
            )
            if resp.status_code != 200:
                logger.error(f"TelcoSMS error: {resp.status_code} {resp.text}")
    except Exception as exc:
        logger.error(f"TelcoSMS exception: {exc}")


async def _send_verification_email(email: str, token: str, full_name: str) -> None:
    """Send email verification link via SendGrid."""
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    if not settings.TWILIO_SENDGRID_API_KEY:
        logger.info(f"[EMAIL-VERIFY] To: {email} | Link: {verify_url}")
        return

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(api_key=settings.TWILIO_SENDGRID_API_KEY)
        message = Mail(
            from_email=("noreply@strongx.it.ao", "StrongX"),
            to_emails=email,
            subject="Verify your StrongX email",
            html_content=(
                f"<p>Hi {full_name},</p>"
                f"<p>Click below to verify your email:</p>"
                f'<p><a href="{verify_url}">Verify Email</a></p>'
                f"<p>This link expires in 24 hours.</p>"
            ),
        )
        sg.send(message)
    except Exception as exc:
        logger.error(f"SendGrid exception: {exc}")


async def _send_password_reset_email(email: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    if not settings.TWILIO_SENDGRID_API_KEY:
        logger.info(f"[PASSWORD-RESET] To: {email} | Link: {reset_url}")
        return

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(api_key=settings.TWILIO_SENDGRID_API_KEY)
        message = Mail(
            from_email=("noreply@strongx.it.ao", "StrongX"),
            to_emails=email,
            subject="Reset your StrongX password",
            html_content=(
                f"<p>Click below to reset your password:</p>"
                f'<p><a href="{reset_url}">Reset Password</a></p>'
                f"<p>This link expires in 1 hour. If you did not request this, ignore this email.</p>"
            ),
        )
        sg.send(message)
    except Exception as exc:
        logger.error(f"SendGrid exception: {exc}")


async def register_user(db: AsyncSession, full_name: str, email: str, phone: str, password: str) -> str:
    # Check uniqueness
    existing_email = await get_user_by_email(db, email)
    if existing_email:
        raise ConflictError("Email already registered")

    existing_phone = await get_user_by_phone(db, phone)
    if existing_phone:
        raise ConflictError("Phone already registered")

    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        phone_verified=False,
        email_verified=False,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # Create wallet
    wallet = Wallet(user_id=user.id)
    db.add(wallet)
    await db.flush()

    # Generate + store OTP
    otp = generate_otp()
    redis = await get_redis()
    await redis.setex(f"otp:{phone}", 600, otp)  # 10 min TTL

    await _send_otp_sms(phone, otp)

    return "OTP sent to phone"


async def verify_phone(db: AsyncSession, phone: str, otp: str) -> str:
    redis = await get_redis()
    stored_otp = await redis.get(f"otp:{phone}")

    if not stored_otp or stored_otp != otp:
        raise ValidationError("Invalid or expired OTP")

    user = await get_user_by_phone(db, phone)
    if not user:
        raise NotFoundError("User not found")

    user.phone_verified = True
    await db.flush()

    await redis.delete(f"otp:{phone}")

    # Send email verification
    token = create_email_verify_token(user.id)
    await _send_verification_email(user.email, token, user.full_name)

    return "Phone verified. Check email to continue."


async def verify_email(db: AsyncSession, token: str) -> str:
    try:
        payload = decode_token(token)
    except Exception:
        raise ValidationError("Invalid or expired token")

    if payload.get("purpose") != "email_verify":
        raise ValidationError("Invalid token purpose")

    user_id = uuid.UUID(payload["sub"])
    from app.modules.users.service import get_user_by_id

    user = await get_user_by_id(db, user_id)
    if not user:
        raise NotFoundError("User not found")

    user.email_verified = True
    await db.flush()

    return "Email verified. You can now log in."


async def login_user(db: AsyncSession, email: str, password: str) -> dict:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")

    if not user.is_active:
        raise ForbiddenError("Account is deactivated")

    if not user.phone_verified:
        raise ForbiddenError("Phone not verified. Check your SMS for the OTP.")

    if not user.email_verified:
        raise ForbiddenError("Email not verified. Check your inbox.")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Store refresh token in Redis (hash of token as subkey)
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()[:16]
    redis = await get_redis()
    await redis.setex(
        f"refresh:{user.id}:{token_hash}",
        settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        "1",
    )

    return {
        "user": {
            "id": str(user.id),
            "name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "emailVerified": user.email_verified,
            "phoneVerified": user.phone_verified,
            "isAdmin": user.is_admin,
        },
        "tokens": {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "expiresIn": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        },
    }


async def refresh_tokens(refresh_token: str) -> dict:
    try:
        payload = decode_token(refresh_token)
    except Exception:
        raise UnauthorizedError("Invalid refresh token")

    if payload.get("type") != "refresh":
        raise UnauthorizedError("Not a refresh token")

    user_id = payload["sub"]
    token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()[:16]

    redis = await get_redis()
    key = f"refresh:{user_id}:{token_hash}"
    exists = await redis.exists(key)
    if not exists:
        raise UnauthorizedError("Refresh token revoked or expired")

    new_access = create_access_token(user_id)
    return {
        "accessToken": new_access,
        "refreshToken": refresh_token,
        "expiresIn": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


async def logout_user(user_id: uuid.UUID, refresh_token: Optional[str] = None) -> None:
    redis = await get_redis()
    if refresh_token:
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()[:16]
        await redis.delete(f"refresh:{user_id}:{token_hash}")
    else:
        # Delete all refresh tokens for user
        pattern = f"refresh:{user_id}:*"
        keys = await redis.keys(pattern)
        if keys:
            await redis.delete(*keys)


async def resend_otp(phone: str) -> str:
    redis = await get_redis()
    rate_key = f"otp_rate:{phone}"
    count = await redis.incr(rate_key)
    if count == 1:
        await redis.expire(rate_key, 3600)  # 1 hour window
    if count > 3:
        raise RateLimitError("OTP rate limit: max 3 per hour per phone")

    otp = generate_otp()
    await redis.setex(f"otp:{phone}", 600, otp)
    await _send_otp_sms(phone, otp)
    return "OTP resent"


async def forgot_password(db: AsyncSession, email: str) -> str:
    user = await get_user_by_email(db, email)
    if user:
        token = create_password_reset_token(user.id)
        await _send_password_reset_email(email, token)
    # Always return same message to prevent user enumeration
    return "If that email exists, a reset link has been sent."


async def reset_password(db: AsyncSession, token: str, new_password: str) -> str:
    try:
        payload = decode_token(token)
    except Exception:
        raise ValidationError("Invalid or expired token")

    if payload.get("purpose") != "password_reset":
        raise ValidationError("Invalid token purpose")

    user_id = uuid.UUID(payload["sub"])
    from app.modules.users.service import get_user_by_id

    user = await get_user_by_id(db, user_id)
    if not user:
        raise NotFoundError("User not found")

    user.password_hash = hash_password(new_password)
    await db.flush()

    return "Password reset successfully. You can now log in."
