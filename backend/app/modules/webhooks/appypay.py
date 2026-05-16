import secrets
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, Query, Request, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.socket import emit_to_user
from app.modules.notifications.service import create_notification
from app.modules.wallet.models import Payment, Wallet, WalletTransaction
from app.modules.wallet.service import TERMINAL_STATUSES

APPYPAY_STATUS_MAP = {
    # (successful, status_keyword) → internal status
}


def _map_appypay_status(successful: bool | None, provider_status: str | None) -> str:
    if successful is True:
        return "paid"
    if successful is False:
        ps = (provider_status or "").lower()
        if "cancelled" in ps or "canceled" in ps:
            return "cancelled"
        if "expired" in ps:
            return "expired"
        return "failed"
    return "pending"


async def handle_appypay_webhook(
    request: Request,
    db: AsyncSession,
    token: str = Query(...),
) -> dict:
    # Validate token
    if not secrets.compare_digest(token, settings.APPYPAY_WEBHOOK_TOKEN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid webhook token")

    # Parse body
    try:
        payload: dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON")

    merchant_txn_id = payload.get("merchantTransactionId")
    if not merchant_txn_id:
        return {"status": "ignored", "reason": "no merchantTransactionId"}

    # Find payment
    result = await db.execute(
        select(Payment).where(Payment.merchant_transaction_id == merchant_txn_id).with_for_update()
    )
    payment = result.scalar_one_or_none()

    if not payment:
        logger.warning(f"AppyPay webhook: unknown merchantTransactionId={merchant_txn_id}")
        return {"status": "ignored", "reason": "payment not found"}

    # Append webhook event
    events = list(payment.webhook_events or [])
    events.append(payload)
    payment.webhook_events = events

    # Don't regress from terminal state
    if payment.status in TERMINAL_STATUSES:
        logger.info(f"AppyPay webhook: payment {payment.id} already in terminal state {payment.status}")
        await db.flush()
        return {"status": "ok", "message": "already terminal"}

    new_status = _map_appypay_status(
        payload.get("successful"),
        payload.get("status"),
    )

    payment.status = new_status
    payment.provider_successful = payload.get("successful")
    payment.provider_status = payload.get("status")
    payment.provider_code = payload.get("code")
    payment.provider_message = payload.get("message")
    payment.transaction_id = payload.get("transactionId") or payment.transaction_id
    payment.provider_id = payload.get("providerId") or payment.provider_id

    if new_status == "paid":
        payment.paid_at = datetime.now(timezone.utc)

        # Credit wallet (SELECT FOR UPDATE)
        wallet_result = await db.execute(
            select(Wallet).where(Wallet.user_id == payment.user_id).with_for_update()
        )
        wallet = wallet_result.scalar_one_or_none()
        if wallet:
            wallet.balance += payment.amount

        # Mark wallet_transaction completed
        if payment.wallet_transaction_id:
            txn_result = await db.execute(
                select(WalletTransaction).where(
                    WalletTransaction.id == payment.wallet_transaction_id
                ).with_for_update()
            )
            txn = txn_result.scalar_one_or_none()
            if txn:
                txn.status = "completed"

        await db.flush()

        # Emit balance update
        if wallet:
            await emit_to_user(
                str(payment.user_id),
                "wallet.balance.updated",
                {"balance": float(wallet.balance), "currency": wallet.currency},
            )

        # Create in-app notification
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

    logger.info(f"AppyPay webhook: payment {payment.id} → {new_status}")
    return {"status": "ok"}
