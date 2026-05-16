import uuid
from typing import Any, Optional

from loguru import logger

from app.core.config import settings
from app.core.socket import emit_to_user


async def send_email_task(
    ctx: dict[str, Any],
    message_id: str,
    user_id: str,
    to: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
) -> None:
    """ARQ worker task: send email via SendGrid and update message status."""
    from app.core.database import AsyncSessionLocal
    from app.modules.sms.models import Message
    from sqlalchemy import select

    logger.info(f"[Email Worker] Sending to={to} message_id={message_id}")

    status_value = "sent"
    provider_message_id = None
    error_message = None

    try:
        if not settings.TWILIO_SENDGRID_API_KEY:
            logger.warning(f"[Email Worker] SendGrid not configured. Simulating send to={to}")
            provider_message_id = f"simulated_{message_id[:8]}"
        else:
            import sendgrid
            from sendgrid.helpers.mail import Content, Mail, To

            sg = sendgrid.SendGridAPIClient(api_key=settings.TWILIO_SENDGRID_API_KEY)
            mail = Mail(
                from_email=("noreply@strongx.it.ao", "StrongX"),
                to_emails=to,
                subject=subject,
            )
            mail.add_content(Content("text/html", body_html))
            if body_text:
                mail.add_content(Content("text/plain", body_text))

            response = sg.send(mail)

            if response.status_code in (200, 201, 202):
                # X-Message-Id header contains the SendGrid message ID
                provider_message_id = response.headers.get("X-Message-Id", "")
                logger.info(f"[Email Worker] Success message_id={message_id} sg_id={provider_message_id}")
            else:
                status_value = "failed"
                error_message = f"SendGrid HTTP {response.status_code}: {response.body}"
                logger.error(f"[Email Worker] Failed: {error_message}")

    except Exception as exc:
        status_value = "failed"
        error_message = str(exc)[:500]
        logger.exception(f"[Email Worker] Exception for message_id={message_id}: {exc}")

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
            logger.error(f"[Email Worker] DB update failed: {exc}")
            await db.rollback()

    await emit_to_user(
        user_id,
        "message.status.updated",
        {
            "message_id": message_id,
            "status": status_value,
            "channel": "email",
            "updated_at": None,
        },
    )
