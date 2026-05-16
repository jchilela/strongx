from typing import Any

from fastapi import Request
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.socket import emit_to_user
from app.modules.sms.models import Message

SENDGRID_STATUS_MAP = {
    "delivered": "delivered",
    "open": "delivered",
    "click": "delivered",
    "bounce": "failed",
    "dropped": "failed",
    "deferred": "queued",
    "processed": "sent",
    "spam_report": "failed",
    "unsubscribe": "delivered",
    "group_unsubscribe": "delivered",
}


async def handle_sendgrid_webhook(request: Request, db: AsyncSession) -> dict:
    try:
        events: list[dict[str, Any]] = await request.json()
    except Exception:
        return {"status": "invalid json"}

    if not isinstance(events, list):
        events = [events]

    for event in events:
        sg_message_id: str = event.get("sg_message_id", "")
        # SendGrid appends filter info after the first dot
        base_id = sg_message_id.split(".")[0] if sg_message_id else ""
        event_type: str = event.get("event", "")

        internal_status = SENDGRID_STATUS_MAP.get(event_type)
        if not internal_status or not base_id:
            continue

        result = await db.execute(
            select(Message).where(Message.provider_message_id == base_id)
        )
        msg = result.scalar_one_or_none()

        if not msg:
            logger.debug(f"SendGrid webhook: unknown sg_message_id={base_id}")
            continue

        # Don't regress from delivered
        if msg.status == "delivered" and internal_status != "delivered":
            continue

        msg.status = internal_status
        if event_type in ("bounce", "dropped"):
            msg.error_message = event.get("reason")

        await db.flush()

        await emit_to_user(
            str(msg.user_id),
            "message.status.updated",
            {
                "message_id": str(msg.id),
                "status": internal_status,
                "channel": "email",
                "updated_at": msg.updated_at.isoformat() if msg.updated_at else None,
            },
        )

    return {"status": "ok"}
