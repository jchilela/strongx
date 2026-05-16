import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, Field


class WalletResponse(BaseModel):
    balance: Decimal
    currency: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class TopUpRequest(BaseModel):
    model_config = {"populate_by_name": True}
    amount: Decimal = Field(..., gt=0, description="Amount in AOA")
    method: str = Field("reference", pattern="^(gpo|reference)$", alias="paymentMethod")
    phone: Optional[str] = None
    email: Optional[str] = None


class TopUpResponse(BaseModel):
    payment_id: uuid.UUID
    merchant_transaction_id: str
    status: str
    reference: Optional[str] = None
    entity: Optional[str] = None
    due_date: Optional[datetime] = None


class TransactionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    amount: Decimal
    description: Optional[str]
    reference: Optional[str]
    status: str
    # metadata_ is the Python ORM attribute (column name is 'metadata')
    extra_metadata: Optional[Any] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_obj(cls, obj) -> "TransactionResponse":
        instance = cls.model_validate(obj)
        instance.extra_metadata = getattr(obj, "metadata_", None)
        return instance


class TransactionListResponse(BaseModel):
    items: list[TransactionResponse]
    total: int
    page: int
    page_size: int


class PaymentResponse(BaseModel):
    id: uuid.UUID
    merchant_transaction_id: str
    method: str
    status: str
    amount: Decimal
    currency: str
    payment_reference: Optional[str]
    entity_number: Optional[str]
    expires_at: Optional[datetime]
    paid_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    items: list[PaymentResponse]
    total: int
    page: int
    page_size: int
