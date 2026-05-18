import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

import httpx
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, NotFoundError
from app.modules.wallet.models import Payment, Wallet, WalletTransaction

TERMINAL_STATUSES = {"paid", "failed", "cancelled", "expired"}


def _strongpay_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.STRONGPAY_API_KEY}",
        "Content-Type": "application/json",
    }


async def get_wallet(db: AsyncSession, user_id: uuid.UUID) -> Wallet:
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise NotFoundError("Wallet not found")
    return wallet


async def initiate_topup(
    db: AsyncSession,
    user_id: uuid.UUID,
    amount: Decimal,
    method: str,
    phone: str,
    name: str,
    email: Optional[str],
) -> Payment:
    # Map frontend method name to StrongPay method name
    sp_method = "ref" if method == "reference" else "gpo"

    payload: dict = {
        "method": sp_method,
        "amount": float(amount),
        "currency": "AOA",
        "description": "Wallet TopUp",
    }
    if sp_method == "gpo":
        # GPO provider requires digits only — strip leading +
        payload["customer_name"] = name
        payload["customer_phone"] = phone.lstrip("+") if phone else phone
        if email:
            payload["customer_email"] = email

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.STRONGPAY_BASE_URL}/api/v1/payments",
            json=payload,
            headers=_strongpay_headers(),
        )

    if resp.status_code not in (200, 201):
        logger.error(f"StrongPay charge error: {resp.status_code} {resp.text}")
        raise ExternalServiceError(f"Payment provider error: {resp.text}")

    data = resp.json()

    # Create wallet_transaction (pending)
    txn = WalletTransaction(
        user_id=user_id,
        type="credit",
        amount=amount,
        description=f"Wallet top-up via {method.upper()}",
        status="pending",
    )
    db.add(txn)
    await db.flush()
    await db.refresh(txn)

    # Create payment record
    payment = Payment(
        user_id=user_id,
        wallet_transaction_id=txn.id,
        merchant_transaction_id=data.get("id", str(uuid.uuid4()))[:15],
        method=method,
        status=data.get("status", "pending"),
        amount=amount,
        customer_name=name,
        customer_email=email,
        customer_phone=phone,
        payment_reference=data.get("payment_reference"),
        entity_number=data.get("entity_number"),
        expires_at=_parse_date(data.get("expires_at")),
        provider_id=data.get("id"),           # StrongPay internal UUID — used for status polling
        transaction_id=data.get("transaction_id"),  # AppyPay charge ID
        provider_successful=data.get("provider_successful"),
        provider_status=data.get("provider_status"),
        provider_code=data.get("provider_code"),
        provider_message=data.get("provider_message"),
    )
    db.add(payment)
    await db.flush()
    await db.refresh(payment)

    return payment


def _parse_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


async def list_transactions(
    db: AsyncSession, user_id: uuid.UUID, page: int, page_size: int
) -> tuple[list[tuple[WalletTransaction, Optional[Payment]]], int]:
    count_q = await db.execute(
        select(func.count())
        .select_from(WalletTransaction)
        .where(WalletTransaction.user_id == user_id)
    )
    total = count_q.scalar_one()
    result = await db.execute(
        select(WalletTransaction, Payment)
        .outerjoin(Payment, Payment.wallet_transaction_id == WalletTransaction.id)
        .where(WalletTransaction.user_id == user_id)
        .order_by(WalletTransaction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.all()), total


async def sync_pending_payments(db: AsyncSession, user_id: Optional[uuid.UUID] = None) -> int:
    """Poll StrongPay for all pending payments and apply status updates. Returns count synced."""
    q = select(Payment).where(Payment.status == "pending")
    if user_id:
        q = q.where(Payment.user_id == user_id)
    result = await db.execute(q)
    pending = list(result.scalars().all())
    if not pending:
        return 0

    synced = 0

    async with httpx.AsyncClient(timeout=30) as client:
        for payment in pending:
            if not payment.provider_id:
                continue

            resp = await client.get(
                f"{settings.STRONGPAY_BASE_URL}/api/v1/payments/{payment.provider_id}",
                headers=_strongpay_headers(),
            )
            if resp.status_code != 200:
                logger.warning(f"StrongPay poll {payment.provider_id}: {resp.status_code}")
                continue

            data = resp.json()
            new_status = data.get("status", "pending").lower()

            # Normalise any provider-specific aliases
            _alias = {"success": "paid", "canceled": "cancelled"}
            new_status = _alias.get(new_status, new_status)

            if new_status == payment.status:
                continue

            payment.status = new_status
            payment.provider_successful = (new_status == "paid")
            payment.provider_status = new_status

            if new_status == "paid":
                payment.paid_at = datetime.now(timezone.utc)
                await _credit_wallet(db, payment)

            elif new_status in TERMINAL_STATUSES:
                await _mark_transaction(db, payment, new_status)

            synced += 1
            logger.info(f"StrongPay poll: payment {payment.id} → {new_status}")

    await db.flush()
    return synced


async def _credit_wallet(db: AsyncSession, payment: Payment) -> None:
    wallet_result = await db.execute(
        select(Wallet).where(Wallet.user_id == payment.user_id).with_for_update()
    )
    wallet = wallet_result.scalar_one_or_none()
    if wallet:
        wallet.balance += payment.amount

    await _mark_transaction(db, payment, "completed")


async def _mark_transaction(db: AsyncSession, payment: Payment, status: str) -> None:
    if not payment.wallet_transaction_id:
        return
    txn_result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.id == payment.wallet_transaction_id)
        .with_for_update()
    )
    txn = txn_result.scalar_one_or_none()
    if txn:
        txn.status = status


async def list_payments(
    db: AsyncSession, user_id: uuid.UUID, page: int, page_size: int
) -> tuple[list[Payment], int]:
    base = select(Payment).where(Payment.user_id == user_id)
    count = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count.scalar_one()
    result = await db.execute(
        base.order_by(Payment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total
