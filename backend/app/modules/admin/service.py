import uuid
from decimal import Decimal
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.users.models import User
from app.modules.applications.models import Application
from app.modules.auth.models import ApiKey
from app.core.exceptions import NotFoundError


async def list_users(db: AsyncSession) -> list[User]:
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    return user


async def update_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    is_active: Optional[bool] = None,
    sms_cost: Optional[Decimal] = None,
    email_cost: Optional[Decimal] = None,
    whatsapp_cost: Optional[Decimal] = None,
) -> User:
    user = await get_user(db, user_id)
    if is_active is not None:
        user.is_active = is_active
    if sms_cost is not None:
        user.sms_cost = sms_cost
    if email_cost is not None:
        user.email_cost = email_cost
    if whatsapp_cost is not None:
        user.whatsapp_cost = whatsapp_cost
    await db.flush()
    return user


async def list_user_api_keys(db: AsyncSession, user_id: uuid.UUID) -> list[ApiKey]:
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user_id).order_by(ApiKey.created_at.desc())
    )
    return list(result.scalars().all())


async def toggle_api_key(db: AsyncSession, key_id: uuid.UUID, is_active: bool) -> ApiKey:
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    key = result.scalar_one_or_none()
    if not key:
        raise NotFoundError("API key not found")
    key.is_active = is_active
    await db.flush()
    return key


async def list_applications(db: AsyncSession, status: Optional[str] = None) -> list[Application]:
    q = select(Application).order_by(Application.created_at.desc())
    if status:
        q = q.where(Application.status == status)
    result = await db.execute(q)
    return list(result.scalars().all())


async def approve_application(db: AsyncSession, app_id: uuid.UUID) -> Application:
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise NotFoundError("Application not found")
    app.status = "approved"
    app.rejected_reason = None
    await db.flush()
    return app


async def reject_application(db: AsyncSession, app_id: uuid.UUID, reason: str) -> Application:
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise NotFoundError("Application not found")
    app.status = "rejected"
    app.rejected_reason = reason
    await db.flush()
    return app
