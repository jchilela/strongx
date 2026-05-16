import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class EmailSendRequest(BaseModel):
    to: EmailStr
    subject: str = Field(..., min_length=1, max_length=500)
    body_html: str = Field(..., min_length=1)
    body_text: Optional[str] = None
    application_id: Optional[uuid.UUID] = None


class EmailBulkSendRequest(BaseModel):
    recipients: list[EmailStr] = Field(..., min_length=1, max_length=500)
    subject: str = Field(..., min_length=1, max_length=500)
    body_html: str = Field(..., min_length=1)
    body_text: Optional[str] = None
    application_id: Optional[uuid.UUID] = None


class EmailSendResponse(BaseModel):
    message_id: uuid.UUID
    status: str


class EmailBulkSendResponse(BaseModel):
    enqueued: int
    message_ids: list[uuid.UUID]
    total_cost: float
