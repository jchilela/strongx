import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    application_id: Optional[uuid.UUID] = None


class ApiKeyCreateResponse(BaseModel):
    id: uuid.UUID
    name: str
    key: str  # Full key shown only on creation
    prefix: str
    application_id: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    prefix: str
    application_id: Optional[uuid.UUID]
    is_active: bool
    last_used_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class UsageStats(BaseModel):
    key_id: uuid.UUID
    key_name: str
    key_prefix: str
    sms_count: int
    email_count: int
    whatsapp_count: int
    total_cost: float
