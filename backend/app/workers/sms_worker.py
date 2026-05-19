import uuid
from typing import Any

import httpx
from loguru import logger

from app.core.config import settings
from app.core.socket import emit_to_user

# Import all models so SQLAlchemy can resolve cross-model relationships at startup
import app.modules.users.models  # noqa: F401
import app.modules.applications.models  # noqa: F401
import app.modules.wallet.models  # noqa: F401
import app.modules.auth.models  # noqa: F401
import app.modules.notifications.models  # noqa: F401
import app.modules.sms.models  # noqa: F401


async def send_sms_task(ctx: dict[str, Any], message_id: str, user_id: str, to: str, message: str) -> None:
    """ARQ worker task: send SMS via telcosms.co.ao and update message status."""
    from app.core.database import AsyncSessionLocal
    from app.modules.sms.models import Message
    from app.modules.applications.models import Application
    from sqlalchemy import select

    logger.info(f"[SMS Worker] Sending to={to} message_id={message_id}")

    status_value = "sent"
    provider_message_id = None
    error_message = None

    # Resolve which TelcoSMS API key to use for this message
    telcosms_key = settings.TELCOSMS_API_KEY
    async with AsyncSessionLocal() as db:
        try:
            msg_result = await db.execute(
                select(Message).where(Message.id == uuid.UUID(message_id))
            )
            msg_row = msg_result.scalar_one_or_none()
            if msg_row and msg_row.application_id:
                app_result = await db.execute(
                    select(Application).where(Application.id == msg_row.application_id)
                )
                app = app_result.scalar_one_or_none()
                if app and app.telcosms_api_key:
                    telcosms_key = app.telcosms_api_key
        except Exception as exc:
            logger.error(f"[SMS Worker] Could not resolve app key for message_id={message_id}: {exc}")

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                settings.TELCOSMS_URL,
                json={
                    "message": {
                        "api_key_app": telcosms_key,
                        "phone_number": to,
                        "message_body": message,
                    }
                },
            )

        if resp.status_code == 200:
            data = resp.json()
            provider_message_id = str(data.get("messageId") or data.get("id") or data.get("message_id") or "")
            logger.info(f"[SMS Worker] Success message_id={message_id} provider_id={provider_message_id}")
        else:
            status_value = "failed"
            error_message = f"TelcoSMS HTTP {resp.status_code}: {resp.text[:200]}"
            logger.error(f"[SMS Worker] Failed: {error_message}")

    except Exception as exc:
        status_value = "failed"
        error_message = str(exc)[:500]
        logger.exception(f"[SMS Worker] Exception for message_id={message_id}: {exc}")

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
            logger.error(f"[SMS Worker] DB update failed: {exc}")
            await db.rollback()

    # Emit Socket.IO
    await emit_to_user(
        user_id,
        "message.status.updated",
        {
            "message_id": message_id,
            "status": status_value,
            "channel": "sms",
            "updated_at": None,
        },
    )
