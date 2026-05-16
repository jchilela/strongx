import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.security import generate_api_key
from app.modules.auth.models import ApiKey
from app.modules.developer.schemas import ApiKeyCreateResponse, UsageStats
from app.modules.sms.models import Message


async def create_api_key(
    db: AsyncSession,
    user_id: uuid.UUID,
    name: str,
    application_id: Optional[uuid.UUID] = None,
) -> tuple[ApiKey, str]:
    """Returns (ApiKey, full_key). full_key must be shown to user only once."""
    full_key, key_hash, prefix = generate_api_key()

    api_key = ApiKey(
        user_id=user_id,
        application_id=application_id,
        name=name,
        key_hash=key_hash,
        key_prefix=prefix,
    )
    db.add(api_key)
    await db.flush()
    await db.refresh(api_key)

    return api_key, full_key


async def list_api_keys(db: AsyncSession, user_id: uuid.UUID) -> list[ApiKey]:
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.user_id == user_id, ApiKey.is_active == True  # noqa: E712
        ).order_by(ApiKey.created_at.desc())
    )
    return list(result.scalars().all())


async def revoke_api_key(
    db: AsyncSession, key_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user_id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise NotFoundError("API key not found")
    key.is_active = False
    await db.flush()


async def _count_messages_by_channel(
    db: AsyncSession,
    user_id: uuid.UUID,
    channel: str,
    application_id: Optional[uuid.UUID],
) -> int:
    conditions = [Message.user_id == user_id, Message.channel == channel]
    if application_id:
        conditions.append(Message.application_id == application_id)
    result = await db.execute(
        select(func.count()).select_from(Message).where(*conditions)
    )
    return result.scalar_one()


async def _sum_message_cost(
    db: AsyncSession,
    user_id: uuid.UUID,
    application_id: Optional[uuid.UUID],
) -> float:
    conditions = [Message.user_id == user_id]
    if application_id:
        conditions.append(Message.application_id == application_id)
    result = await db.execute(
        select(func.coalesce(func.sum(Message.cost), 0)).where(*conditions)
    )
    return float(result.scalar_one())


async def get_usage_stats(db: AsyncSession, user_id: uuid.UUID) -> list[UsageStats]:
    keys_result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user_id)
    )
    keys = list(keys_result.scalars().all())

    stats = []
    for key in keys:
        app_id = key.application_id
        stats.append(
            UsageStats(
                key_id=key.id,
                key_name=key.name,
                key_prefix=key.key_prefix,
                sms_count=await _count_messages_by_channel(db, user_id, "sms", app_id),
                email_count=await _count_messages_by_channel(db, user_id, "email", app_id),
                whatsapp_count=await _count_messages_by_channel(db, user_id, "whatsapp", app_id),
                total_cost=await _sum_message_cost(db, user_id, app_id),
            )
        )

    return stats
