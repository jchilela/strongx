import hashlib
import hmac
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException, Request, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.socket import emit_to_user
from app.modules.notifications.service import create_notification
from app.modules.wallet.models import Payment, Wallet, WalletTransaction
from app.modules.wallet.service import TERMINAL_STATUSES


async def _send_sms_confirmation(phone: str, amount, new_balance) -> None:
    """Send an SMS to the user confirming their wallet has been credited."""
    if not settings.TELCOSMS_API_KEY:
        logger.warning(
            f"TelcoSMS not configured. SMS confirmation for {phone}: {amount} AOA credited."
        )
        return
    message = (
        f"StrongX: Carteira carregada com {amount} AOA. "
        f"Saldo actual: {new_balance} AOA."
    )
    # Keep under 160 chars
    if len(message) > 160:
        message = message[:157] + "..."
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                settings.TELCOSMS_URL,
                json={
                    "message": {
                        "api_key_app": settings.TELCOSMS_API_KEY,
                        "phone_number": phone,
                        "message_body": message,
                    }
                },
            )
            if resp.status_code != 200:
                logger.error(f"TelcoSMS SMS confirmation error: {resp.status_code} {resp.text}")
    except Exception as exc:
        logger.error(f"TelcoSMS SMS confirmation exception: {exc}")


def _verify_signature(secret: str, body: bytes, header: str | None) -> bool:
    if not secret:
        return True
    if not header:
        return False
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header)


async def handle_strongpay_webhook(request: Request, db: AsyncSession) -> dict:
    body = await request.body()

    # Verify HMAC signature when secret is configured
    sig = request.headers.get("X-StrongPay-Signature")
    if not _verify_signature(settings.STRONGPAY_WEBHOOK_SECRET, body, sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    try:
        payload: dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON")

    event = payload.get("event")
    if event != "payment.updated":
        return {"status": "ignored", "reason": f"unhandled event: {event}"}

    # StrongPay uses `payment_id` (its internal UUID) which we stored as provider_id
    strongpay_id = payload.get("payment_id")
    if not strongpay_id:
        return {"status": "ignored", "reason": "no payment_id"}

    result = await db.execute(
        select(Payment).where(Payment.provider_id == strongpay_id).with_for_update()
    )
    payment = result.scalar_one_or_none()

    if not payment:
        logger.warning(f"StrongPay webhook: unknown payment_id={strongpay_id}")
        return {"status": "ignored", "reason": "payment not found"}

    # Append raw event for audit trail
    events = list(payment.webhook_events or [])
    events.append(payload)
    payment.webhook_events = events

    # Don't regress from a terminal state
    if payment.status in TERMINAL_STATUSES:
        logger.info(f"StrongPay webhook: payment {payment.id} already terminal ({payment.status})")
        await db.flush()
        return {"status": "ok", "message": "already terminal"}

    new_status = payload.get("status", "pending").lower()
    _alias = {"success": "paid", "canceled": "cancelled"}
    new_status = _alias.get(new_status, new_status)

    payment.status = new_status
    payment.provider_successful = (new_status == "paid")
    payment.provider_status = new_status
    payment.transaction_id = payload.get("transaction_id") or payment.transaction_id

    if new_status == "paid":
        payment.paid_at = datetime.fromisoformat(payload["paid_at"]) if payload.get("paid_at") else datetime.now(timezone.utc)

        # Credit wallet atomically
        wallet_result = await db.execute(
            select(Wallet).where(Wallet.user_id == payment.user_id).with_for_update()
        )
        wallet = wallet_result.scalar_one_or_none()
        if wallet:
            wallet.balance += payment.amount

        # Mark wallet transaction completed
        if payment.wallet_transaction_id:
            txn_result = await db.execute(
                select(WalletTransaction)
                .where(WalletTransaction.id == payment.wallet_transaction_id)
                .with_for_update()
            )
            txn = txn_result.scalar_one_or_none()
            if txn:
                txn.status = "completed"

        await db.flush()

        if wallet:
            await emit_to_user(
                str(payment.user_id),
                "wallet.balance.updated",
                {"balance": float(wallet.balance), "currency": wallet.currency},
            )

            # Send SMS confirmation to the customer's phone
            if payment.customer_phone:
                await _send_sms_confirmation(
                    phone=payment.customer_phone,
                    amount=payment.amount,
                    new_balance=wallet.balance,
                )

        await create_notification(
            db,
            payment.user_id,
            "Top-up successful",
            f"Your wallet has been credited with {payment.amount} {payment.currency}.",
            "success",
        )

    else:
        await db.flush()
        await create_notification(
            db,
            payment.user_id,
            "Payment update",
            f"Your payment of {payment.amount} {payment.currency} status: {new_status}.",
            "warning" if new_status in ("cancelled", "expired") else "error",
        )

    logger.info(f"StrongPay webhook: payment {payment.id} → {new_status}")
    return {"success": True}
