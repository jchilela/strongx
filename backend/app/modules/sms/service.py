import uuid
from decimal import Decimal
from typing import Optional

from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import InsufficientFundsError, NotFoundError, RateLimitError
from app.core.redis import get_redis
from app.core.socket import emit_to_user
from app.modules.sms.models import Message
from app.modules.wallet.models import Wallet, WalletTransaction


async def check_sms_rate_limit(user_id: uuid.UUID) -> None:
    """Sliding window: 10 SMS/s per user."""
    redis = await get_redis()
    key = f"rate:sms:{user_id}"
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, 1)
    if count > 10:
        raise RateLimitError("SMS rate limit: 10 requests per second")


async def deduct_wallet_cost(
    db: AsyncSession, user_id: uuid.UUID, cost: Decimal, description: str
) -> WalletTransaction:
    """Atomically deduct cost from wallet (SELECT FOR UPDATE)."""
    from sqlalchemy import select

    result = await db.execute(
        select(Wallet).where(Wallet.user_id == user_id).with_for_update()
    )
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise NotFoundError("Wallet not found")
    if wallet.balance < cost:
        raise InsufficientFundsError(
            f"Insufficient balance. Required: {cost} AOA, available: {wallet.balance} AOA"
        )
    wallet.balance -= cost

    txn = WalletTransaction(
        user_id=user_id,
        type="debit",
        amount=cost,
        description=description,
        status="completed",
    )
    db.add(txn)
    await db.flush()
    return txn


async def create_message_record(
    db: AsyncSession,
    user_id: uuid.UUID,
    channel: str,
    to_address: str,
    message_text: str,
    cost: Decimal,
    application_id: Optional[uuid.UUID] = None,
    subject: Optional[str] = None,
    from_name: Optional[str] = None,
) -> Message:
    msg = Message(
        user_id=user_id,
        application_id=application_id,
        channel=channel,
        to_address=to_address,
        message=message_text,
        cost=cost,
        status="queued",
        from_name=from_name or settings.TELCOSMS_FROM,
        subject=subject,
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return msg


async def _get_channel_cost(db: AsyncSession, user_id: uuid.UUID, channel: str) -> Decimal:
    from sqlalchemy import select
    from app.modules.users.models import User
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        custom = getattr(user, f"{channel}_cost", None)
        if custom is not None:
            return Decimal(str(custom))
    defaults = {
        "sms": settings.SMS_COST_PER_UNIT,
        "email": settings.EMAIL_COST_PER_UNIT,
        "whatsapp": settings.WHATSAPP_COST_PER_UNIT,
    }
    return Decimal(str(defaults.get(channel, settings.SMS_COST_PER_UNIT)))


async def send_sms(
    db: AsyncSession,
    user_id: uuid.UUID,
    to: str,
    message: str,
    application_id: Optional[uuid.UUID] = None,
) -> Message:
    await check_sms_rate_limit(user_id)

    if application_id:
        from app.modules.applications.service import check_application_approved
        await check_application_approved(db, application_id)

    cost = await _get_channel_cost(db, user_id, "sms")
    await deduct_wallet_cost(
        db, user_id, cost, f"SMS to {to}"
    )

    msg = await create_message_record(
        db, user_id, "sms", to, message, cost, application_id
    )

    # Enqueue ARQ task
    from app.workers.settings import get_arq_pool

    pool = await get_arq_pool()
    await pool.enqueue_job("send_sms_task", str(msg.id), str(user_id), to, message)

    await emit_to_user(
        str(user_id),
        "message.status.updated",
        {
            "message_id": str(msg.id),
            "status": "queued",
            "channel": "sms",
            "updated_at": msg.created_at.isoformat(),
        },
    )

    return msg


async def list_messages(
    db: AsyncSession,
    user_id: uuid.UUID,
    channel: str,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Message], int]:
    base_query = select(Message).where(
        Message.user_id == user_id, Message.channel == channel
    )
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar_one()

    result = await db.execute(
        base_query.order_by(Message.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = list(result.scalars().all())
    return items, total


async def get_message(
    db: AsyncSession, message_id: uuid.UUID, user_id: uuid.UUID
) -> Message:
    result = await db.execute(
        select(Message).where(Message.id == message_id, Message.user_id == user_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise NotFoundError("Message not found")
    return msg
