import uuid
from typing import Optional

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.notifications.models import InAppNotification


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    body: str,
    type_: str = "info",
) -> InAppNotification:
    notif = InAppNotification(user_id=user_id, title=title, body=body, type=type_)
    db.add(notif)
    await db.flush()
    await db.refresh(notif)
    return notif


async def list_notifications(
    db: AsyncSession, user_id: uuid.UUID, page: int = 1, page_size: int = 20
) -> tuple[list[InAppNotification], int]:
    base = select(InAppNotification).where(InAppNotification.user_id == user_id)
    count_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_result.scalar_one()
    result = await db.execute(
        base.order_by(InAppNotification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total


async def mark_as_read(
    db: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID
) -> InAppNotification:
    result = await db.execute(
        select(InAppNotification).where(
            InAppNotification.id == notification_id,
            InAppNotification.user_id == user_id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise NotFoundError("Notification not found")
    notif.is_read = True
    await db.flush()
    return notif


async def mark_all_as_read(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.execute(
        update(InAppNotification)
        .where(
            InAppNotification.user_id == user_id,
            InAppNotification.is_read == False,  # noqa: E712
        )
        .values(is_read=True)
    )
    return result.rowcount


async def get_unread_count(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count()).where(
            InAppNotification.user_id == user_id,
            InAppNotification.is_read == False,  # noqa: E712
        )
    )
    return result.scalar_one()
