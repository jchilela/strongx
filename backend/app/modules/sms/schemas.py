import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class SmsSendRequest(BaseModel):
    model_config = {"populate_by_name": True}

    to: str = Field(..., description="Recipient phone, e.g. 244XXXXXXXXX")
    message: str = Field(..., min_length=1, max_length=1600)
    application_id: Optional[uuid.UUID] = Field(None, alias="applicationId")


class SmsSendResponse(BaseModel):
    message_id: uuid.UUID
    status: str


class MessageResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    application_id: Optional[uuid.UUID]
    channel: str
    to_address: str
    from_name: Optional[str]
    subject: Optional[str]
    message: str
    status: str
    provider_message_id: Optional[str]
    cost: Decimal
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MessageListResponse(BaseModel):
    items: list[MessageResponse]
    total: int
    page: int
    page_size: int
