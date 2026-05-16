import uuid
from decimal import Decimal
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.socket import emit_to_user
from app.modules.sms.models import Message
from app.modules.sms.service import create_message_record, deduct_wallet_cost


async def send_whatsapp(
    db: AsyncSession,
    user_id: uuid.UUID,
    to: str,
    message: str,
    application_id: Optional[uuid.UUID] = None,
) -> Message:
    cost = Decimal(str(settings.WHATSAPP_COST_PER_UNIT))
    await deduct_wallet_cost(db, user_id, cost, f"WhatsApp to {to}")

    msg = await create_message_record(
        db, user_id, "whatsapp", to, message, cost, application_id,
        from_name=settings.TWILIO_WHATSAPP_FROM,
    )

    from app.workers.settings import get_arq_pool

    pool = await get_arq_pool()
    await pool.enqueue_job("send_whatsapp_task", str(msg.id), str(user_id), to, message)

    await emit_to_user(
        str(user_id),
        "message.status.updated",
        {
            "message_id": str(msg.id),
            "status": "queued",
            "channel": "whatsapp",
            "updated_at": msg.created_at.isoformat(),
        },
    )
    return msg
