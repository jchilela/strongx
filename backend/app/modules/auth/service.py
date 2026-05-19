import asyncio
import hashlib
import smtplib
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
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


def _smtp_send(to_email: str, subject: str, html_body: str) -> None:
    """Send an email via SMTP (runs in thread executor)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())


async def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """Dispatch email via SMTP or SendGrid, log if neither configured."""
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, _smtp_send, to_email, subject, html_body)
            logger.info(f"[EMAIL] Sent to {to_email}: {subject}")
        except Exception as exc:
            logger.error(f"SMTP error sending to {to_email}: {exc}")
        return

    if settings.TWILIO_SENDGRID_API_KEY:
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail
            sg = sendgrid.SendGridAPIClient(api_key=settings.TWILIO_SENDGRID_API_KEY)
            message = Mail(
                from_email=("noreply@strongx.it.ao", "StrongX"),
                to_emails=to_email,
                subject=subject,
                html_content=html_body,
            )
            sg.send(message)
            logger.info(f"[EMAIL-SG] Sent to {to_email}: {subject}")
        except Exception as exc:
            logger.error(f"SendGrid exception: {exc}")
        return

    logger.warning(f"[EMAIL-SKIP] No email provider configured. To={to_email} Subject={subject}")


async def _send_verification_email(email: str, token: str, full_name: str) -> None:
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    await _send_email(
        to_email=email,
        subject="Verify your StrongX email",
        html_body=(
            f"<p>Hi {full_name},</p>"
            f"<p>Click the link below to verify your email address:</p>"
            f'<p><a href="{verify_url}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Verify Email</a></p>'
            f"<p>Or copy this link: {verify_url}</p>"
            f"<p>This link expires in 24 hours.</p>"
            f"<p>— The StrongX Team</p>"
        ),
    )


async def _send_password_reset_email(email: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    await _send_email(
        to_email=email,
        subject="Reset your StrongX password",
        html_body=(
            f"<p>Click the link below to reset your password:</p>"
            f'<p><a href="{reset_url}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>'
            f"<p>Or copy this link: {reset_url}</p>"
            f"<p>This link expires in 1 hour. If you did not request this, ignore this email.</p>"
            f"<p>— The StrongX Team</p>"
        ),
    )


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

    # Create default APP-TESTE application (pre-approved)
    from app.modules.applications.models import Application
    default_app = Application(
        user_id=user.id,
        name="APP-TESTE",
        slug=f"app-teste-{str(user.id)[:8]}",
        description="Default test application",
        status="approved",
        telcosms_api_key="prda0a684bdabbde776c8bc3dd4d7",
    )
    db.add(default_app)
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
            "isSuperAdmin": user.is_super_admin,
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
