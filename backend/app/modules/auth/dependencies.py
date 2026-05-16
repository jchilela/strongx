import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_token, verify_api_key
from app.modules.auth.models import ApiKey
from app.modules.users.models import User
from app.modules.users.service import get_user_by_id

bearer_scheme = HTTPBearer(auto_error=False)


async def _get_current_user_from_token(
    credentials: Optional[HTTPAuthorizationCredentials],
    db: AsyncSession,
) -> User:
    if credentials is None:
        raise UnauthorizedError("Missing authorization token")

    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")

    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    user_id = uuid.UUID(payload["sub"])
    user = await get_user_by_id(db, user_id)
    if not user:
        raise UnauthorizedError("User not found")

    return user


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await _get_current_user_from_token(credentials, db)


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise UnauthorizedError("Account is deactivated")
    return current_user


async def get_current_api_key_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve Bearer token as either JWT or API key."""
    if credentials is None:
        raise UnauthorizedError("Missing authorization token")

    token = credentials.credentials

    # Try JWT first
    if not token.startswith("strx_"):
        try:
            payload = decode_token(token)
            if payload.get("type") == "access":
                user_id = uuid.UUID(payload["sub"])
                user = await get_user_by_id(db, user_id)
                if user and user.is_active:
                    return user
        except JWTError:
            pass

    # Try API key
    prefix = token[:13]
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.key_prefix == prefix,
            ApiKey.is_active == True,  # noqa: E712
        )
    )
    api_keys = list(result.scalars().all())

    for api_key in api_keys:
        if verify_api_key(token, api_key.key_hash):
            # Update last_used_at
            api_key.last_used_at = datetime.now(timezone.utc)
            await db.flush()

            user = await get_user_by_id(db, api_key.user_id)
            if user and user.is_active:
                return user

    raise UnauthorizedError("Invalid API key")
