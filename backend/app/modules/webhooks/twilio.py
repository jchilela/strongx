from typing import Any

from fastapi import Form, HTTPException, Request, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.socket import emit_to_user
from app.modules.sms.models import Message

TWILIO_STATUS_MAP = {
    "queued": "queued",
    "sent": "sent",
    "delivered": "delivered",
    "undelivered": "failed",
    "failed": "failed",
    "read": "delivered",
}


def _validate_twilio_signature(request: Request, body: bytes) -> bool:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not configured, skipping signature validation")
        return True

    try:
        from twilio.request_validator import RequestValidator

        validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
        signature = request.headers.get("X-Twilio-Signature", "")
        url = str(request.url)

        # Parse form params from body
        import urllib.parse

        params = dict(urllib.parse.parse_qsl(body.decode("utf-8")))
        return validator.validate(url, params, signature)
    except Exception as exc:
        logger.error(f"Twilio signature validation error: {exc}")
        return False


async def handle_twilio_webhook(request: Request, db: AsyncSession) -> dict:
    body = await request.body()

    if not _validate_twilio_signature(request, body):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Twilio signature")

    import urllib.parse

    params = dict(urllib.parse.parse_qsl(body.decode("utf-8")))
    message_sid = params.get("MessageSid")
    twilio_status = params.get("MessageStatus", "")

    if not message_sid:
        return {"status": "ignored"}

    # Map Twilio status
    internal_status = TWILIO_STATUS_MAP.get(twilio_status, "sent")

    # Find message by provider_message_id
    result = await db.execute(
        select(Message).where(Message.provider_message_id == message_sid)
    )
    msg = result.scalar_one_or_none()

    if not msg:
        logger.warning(f"Twilio webhook: unknown MessageSid={message_sid}")
        return {"status": "ignored"}

    msg.status = internal_status
    if twilio_status in ("undelivered", "failed"):
        msg.error_message = params.get("ErrorMessage")

    await db.flush()

    await emit_to_user(
        str(msg.user_id),
        "message.status.updated",
        {
            "message_id": str(msg.id),
            "status": internal_status,
            "channel": msg.channel,
            "updated_at": msg.updated_at.isoformat() if msg.updated_at else None,
        },
    )

    logger.info(f"Twilio webhook: msg {msg.id} → {internal_status}")
    return {"status": "ok"}
