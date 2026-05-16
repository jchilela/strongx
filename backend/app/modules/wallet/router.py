from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.wallet import service
from app.modules.wallet.schemas import (
    PaymentListResponse,
    PaymentResponse,
    TopUpRequest,
    TopUpResponse,
    TransactionListResponse,
    TransactionResponse,
    WalletResponse,
)

router = APIRouter(prefix="/v1/wallet", tags=["wallet"])


@router.get("/balance", response_model=WalletResponse)
async def get_balance(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> WalletResponse:
    wallet = await service.get_wallet(db, current_user.id)
    return WalletResponse.model_validate(wallet)


@router.post("/top-up", response_model=TopUpResponse, status_code=status.HTTP_202_ACCEPTED)
async def topup(
    data: TopUpRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TopUpResponse:
    payment = await service.initiate_topup(
        db=db,
        user_id=current_user.id,
        amount=data.amount,
        method=data.method,
        phone=data.phone,
        name=data.name,
        email=data.email,
    )
    return TopUpResponse(
        payment_id=payment.id,
        merchant_transaction_id=payment.merchant_transaction_id,
        status=payment.status,
        reference=payment.payment_reference,
        entity=payment.entity_number,
        due_date=payment.expires_at,
    )


@router.get("/transactions", response_model=TransactionListResponse)
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> TransactionListResponse:
    items, total = await service.list_transactions(db, current_user.id, page, page_size)
    return TransactionListResponse(
        items=[TransactionResponse.from_orm_obj(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/payments", response_model=PaymentListResponse)
async def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> PaymentListResponse:
    items, total = await service.list_payments(db, current_user.id, page, page_size)
    return PaymentListResponse(
        items=[PaymentResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
    )
