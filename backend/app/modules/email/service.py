import uuid
from decimal import Decimal
from typing import Optional

import bleach
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import InsufficientFundsError
from app.core.socket import emit_to_user
from app.modules.sms.models import Message
from app.modules.sms.service import create_message_record, deduct_wallet_cost
from app.modules.wallet.models import Wallet

ALLOWED_TAGS = list(bleach.sanitizer.ALLOWED_TAGS) + [
    "p", "br", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "table", "thead", "tbody", "tr", "th", "td",
    "span", "div", "ul", "ol", "li",
]
ALLOWED_ATTRS = {
    **bleach.sanitizer.ALLOWED_ATTRIBUTES,
    "img": ["src", "alt", "width", "height"],
    "a": ["href", "title", "target"],
    "*": ["style", "class"],
}


def sanitize_html(html: str) -> str:
    return bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS)


async def send_email(
    db: AsyncSession,
    user_id: uuid.UUID,
    to: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
    application_id: Optional[uuid.UUID] = None,
) -> Message:
    if application_id:
        from app.modules.applications.service import check_application_approved
        await check_application_approved(db, application_id)

    from app.modules.sms.service import _get_channel_cost
    cost = await _get_channel_cost(db, user_id, "email")
    await deduct_wallet_cost(db, user_id, cost, f"Email to {to}")

    safe_html = sanitize_html(body_html)
    msg = await create_message_record(
        db, user_id, "email", to, safe_html, cost, application_id, subject=subject
    )

    from app.workers.settings import get_arq_pool

    pool = await get_arq_pool()
    await pool.enqueue_job(
        "send_email_task",
        str(msg.id),
        str(user_id),
        to,
        subject,
        safe_html,
        body_text,
    )

    await emit_to_user(
        str(user_id),
        "message.status.updated",
        {
            "message_id": str(msg.id),
            "status": "queued",
            "channel": "email",
            "updated_at": msg.created_at.isoformat(),
        },
    )
    return msg


async def send_bulk_email(
    db: AsyncSession,
    user_id: uuid.UUID,
    recipients: list[str],
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
    application_id: Optional[uuid.UUID] = None,
) -> tuple[list[Message], Decimal]:
    from sqlalchemy import select
    from app.modules.wallet.models import Wallet

    if application_id:
        from app.modules.applications.service import check_application_approved
        await check_application_approved(db, application_id)

    from app.modules.sms.service import _get_channel_cost
    cost_per = await _get_channel_cost(db, user_id, "email")
    total_cost = cost_per * len(recipients)

    # Single atomic deduction
    result = await db.execute(
        select(Wallet).where(Wallet.user_id == user_id).with_for_update()
    )
    wallet = result.scalar_one_or_none()
    if not wallet or wallet.balance < total_cost:
        raise InsufficientFundsError(
            f"Insufficient balance. Required: {total_cost} AOA"
        )
    wallet.balance -= total_cost
    await db.flush()

    safe_html = sanitize_html(body_html)
    messages = []

    from app.workers.settings import get_arq_pool

    pool = await get_arq_pool()

    for recipient in recipients:
        from app.modules.wallet.models import WalletTransaction

        txn = WalletTransaction(
            user_id=user_id,
            type="debit",
            amount=cost_per,
            description=f"Email to {recipient}",
            status="completed",
        )
        db.add(txn)

        msg = Message(
            user_id=user_id,
            application_id=application_id,
            channel="email",
            to_address=recipient,
            message=safe_html,
            subject=subject,
            cost=cost_per,
            status="queued",
        )
        db.add(msg)
        messages.append(msg)

    await db.flush()
    for msg in messages:
        await db.refresh(msg)
        await pool.enqueue_job(
            "send_email_task",
            str(msg.id),
            str(user_id),
            msg.to_address,
            subject,
            safe_html,
            body_text,
        )

    return messages, total_cost
