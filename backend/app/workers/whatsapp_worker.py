import uuid
from typing import Any

from loguru import logger

from app.core.config import settings
from app.core.socket import emit_to_user


async def send_whatsapp_task(
    ctx: dict[str, Any], message_id: str, user_id: str, to: str, message: str
) -> None:
    """ARQ worker task: send WhatsApp via Twilio and update message status."""
    from app.core.database import AsyncSessionLocal
    from app.modules.sms.models import Message
    from sqlalchemy import select

    logger.info(f"[WhatsApp Worker] Sending to={to} message_id={message_id}")

    status_value = "sent"
    provider_message_id = None
    error_message = None

    try:
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            logger.warning(f"[WhatsApp Worker] Twilio not configured. Simulating send to={to}")
            provider_message_id = f"WA_simulated_{message_id[:8]}"
        else:
            from twilio.rest import Client

            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            twilio_msg = client.messages.create(
                from_=f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}",
                body=message,
                to=f"whatsapp:{to}",
            )
            provider_message_id = twilio_msg.sid
            if twilio_msg.error_code:
                status_value = "failed"
                error_message = f"Twilio error {twilio_msg.error_code}: {twilio_msg.error_message}"
            else:
                logger.info(f"[WhatsApp Worker] Success message_id={message_id} twilio_sid={provider_message_id}")

    except Exception as exc:
        status_value = "failed"
        error_message = str(exc)[:500]
        logger.exception(f"[WhatsApp Worker] Exception for message_id={message_id}: {exc}")

    # Update DB
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(Message).where(Message.id == uuid.UUID(message_id))
            )
            msg = result.scalar_one_or_none()
            if msg:
                msg.status = status_value
                msg.provider_message_id = provider_message_id
                msg.error_message = error_message
                await db.commit()
        except Exception as exc:
            logger.error(f"[WhatsApp Worker] DB update failed: {exc}")
            await db.rollback()

    await emit_to_user(
        user_id,
        "message.status.updated",
        {
            "message_id": message_id,
            "status": status_value,
            "channel": "whatsapp",
            "updated_at": None,
        },
    )
