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
from app.core.redis import get_redis
from app.core.security import generate_merchant_transaction_id
from app.modules.wallet.models import Payment, Wallet, WalletTransaction

TERMINAL_STATUSES = {"paid", "failed", "cancelled", "expired"}


async def _get_appypay_token() -> str:
    """Get/cache AppyPay OAuth2 access token."""
    redis = await get_redis()
    cached = await redis.get("appypay:token")
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            settings.APPYPAY_TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": settings.APPYPAY_CLIENT_ID,
                "client_secret": settings.APPYPAY_CLIENT_SECRET,
                "resource": settings.APPYPAY_RESOURCE,
            },
        )
        if resp.status_code != 200:
            raise ExternalServiceError(f"AppyPay token error: {resp.text}")

        data = resp.json()
        token = data["access_token"]
        expires_in = int(data.get("expires_in", 3600))
        ttl = max(expires_in - 60, 60)  # Cache 60s before expiry
        await redis.setex("appypay:token", ttl, token)
        return token


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
    token = await _get_appypay_token()

    merchant_transaction_id = generate_merchant_transaction_id()

    payment_method_id = (
        settings.APPYPAY_PAYMENT_METHOD_GPO
        if method == "gpo"
        else settings.APPYPAY_PAYMENT_METHOD_REFERENCE
    )

    callback_url = (
        f"{settings.API_URL}/webhooks/appypay?token={settings.APPYPAY_WEBHOOK_TOKEN}"
    )
    payload = {
        "merchantTransactionId": merchant_transaction_id,
        "amount": float(amount),
        "currency": "AOA",
        "description": "StrongX Wallet Top-up",
        "paymentMethod": payment_method_id,
        "callbackUrl": callback_url,
        "customer": {
            "name": name,
            "phone": phone,
        },
    }
    if email:
        payload["customer"]["email"] = email

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.APPYPAY_BASE_URL}/v2.0/charges",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )

    data = resp.json()
    response_status = data.get("responseStatus", {})
    if not response_status.get("successful"):
        logger.error(f"AppyPay charge error: {resp.status_code} {resp.text}")
        raise ExternalServiceError(f"AppyPay error: {resp.text}")

    ref_data = response_status.get("reference") or {}

    # Create wallet_transaction (pending)
    txn = WalletTransaction(
        user_id=user_id,
        type="credit",
        amount=amount,
        description=f"Wallet top-up via {method.upper()}",
        reference=merchant_transaction_id,
        status="pending",
    )
    db.add(txn)
    await db.flush()
    await db.refresh(txn)

    # Create payment record
    payment = Payment(
        user_id=user_id,
        wallet_transaction_id=txn.id,
        merchant_transaction_id=merchant_transaction_id,
        method=method,
        status="pending",
        amount=amount,
        customer_name=name,
        customer_email=email,
        customer_phone=phone,
        payment_reference=ref_data.get("referenceNumber"),
        entity_number=ref_data.get("entity"),
        expires_at=_parse_date(ref_data.get("dueDate")),
        provider_id=data.get("id"),
        transaction_id=data.get("id"),
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
) -> tuple[list[WalletTransaction], int]:
    base = select(WalletTransaction).where(WalletTransaction.user_id == user_id)
    count = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count.scalar_one()
    result = await db.execute(
        base.order_by(WalletTransaction.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total


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
