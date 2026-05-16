import math

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.wallet import service
from app.modules.wallet.schemas import TopUpRequest, TopUpResponse, PaymentResponse

router = APIRouter(prefix="/v1/wallet", tags=["wallet"])


@router.get("/balance")
async def get_balance(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    wallet = await service.get_wallet(db, current_user.id)
    return {
        "success": True,
        "data": {
            "balance": float(wallet.balance),
            "currency": wallet.currency,
            "updatedAt": wallet.updated_at.isoformat(),
        },
    }


@router.post("/top-up", status_code=status.HTTP_202_ACCEPTED)
async def topup(
    data: TopUpRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    payment = await service.initiate_topup(
        db=db,
        user_id=current_user.id,
        amount=data.amount,
        method=data.method,
        phone=data.phone or current_user.phone,
        name=current_user.full_name,
        email=data.email,
    )
    return {
        "success": True,
        "data": {
            "transactionId": str(payment.id),
            "status": payment.status,
            "paymentMethod": payment.method,
            "reference": payment.payment_reference,
            "entity": payment.entity_number,
            "amount": float(payment.amount),
            "expiresAt": payment.expires_at.isoformat() if payment.expires_at else None,
        },
    }


@router.post("/payments/sync", status_code=status.HTTP_200_OK)
async def sync_payments(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    synced = await service.sync_pending_payments(db, user_id=current_user.id)
    await db.commit()
    return {"success": True, "data": {"synced": synced}}


@router.get("/transactions")
async def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    items, total = await service.list_transactions(db, current_user.id, page, limit)
    return {
        "success": True,
        "data": {
            "transactions": [
                {
                    "id": str(t.id),
                    "type": t.type,
                    "amount": float(t.amount),
                    "currency": "AOA",
                    "description": t.description or "",
                    "status": t.status,
                    "reference": t.reference or "",
                    "entity": p.entity_number if p else None,
                    "paymentReference": p.payment_reference if p else None,
                    "paymentMethod": p.method if p else None,
                    "expiresAt": p.expires_at.isoformat() if p and p.expires_at else None,
                    "paidAt": p.paid_at.isoformat() if p and p.paid_at else None,
                    "createdAt": t.created_at.isoformat(),
                }
                for t, p in items
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": math.ceil(total / limit) if total > 0 else 1,
        },
    }
