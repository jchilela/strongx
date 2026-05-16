import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

API_KEY_PREFIX = "strx_"
API_KEY_RANDOM_LENGTH = 32


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def hash_api_key(key: str) -> str:
    return bcrypt.hashpw(key.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_api_key(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def generate_api_key() -> tuple[str, str, str]:
    """
    Returns (full_key, key_hash, key_prefix).
    full_key is shown only once; key_prefix is the first 13 chars stored plainly.
    """
    random_part = secrets.token_urlsafe(API_KEY_RANDOM_LENGTH)[:API_KEY_RANDOM_LENGTH]
    full_key = f"{API_KEY_PREFIX}{random_part}"
    prefix = full_key[:13]
    key_hash = hash_api_key(full_key)
    return full_key, key_hash, prefix


def create_access_token(
    subject: str | UUID,
    extra: Optional[dict[str, Any]] = None,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str | UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_email_verify_token(user_id: str | UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "exp": expire,
        "purpose": "email_verify",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_password_reset_token(user_id: str | UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=1)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "exp": expire,
        "purpose": "password_reset",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and return JWT payload. Raises JWTError on failure."""
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))


def generate_merchant_transaction_id() -> str:
    """15-char alphanumeric unique ID for AppyPay."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(15))
