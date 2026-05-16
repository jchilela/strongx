import uuid
from typing import Optional

from pydantic import BaseModel, Field


class WhatsAppSendRequest(BaseModel):
    to: str = Field(..., description="Recipient phone with country code, e.g. +244XXXXXXXXX")
    message: str = Field(..., min_length=1, max_length=4096)
    application_id: Optional[uuid.UUID] = None


class WhatsAppSendResponse(BaseModel):
    message_id: uuid.UUID
    status: str
