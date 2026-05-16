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
        phone=data.phone,
        name=data.name,
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
                    "createdAt": t.created_at.isoformat(),
                }
                for t in items
            ],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": math.ceil(total / limit) if total > 0 else 1,
        },
    }
