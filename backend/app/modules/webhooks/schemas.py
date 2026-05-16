from typing import Any, Optional

from pydantic import BaseModel


class AppyPayWebhookPayload(BaseModel):
    merchantTransactionId: str
    successful: Optional[bool] = None
    status: Optional[str] = None
    code: Optional[int] = None
    message: Optional[str] = None
    transactionId: Optional[str] = None
    providerId: Optional[str] = None

    model_config = {"extra": "allow"}


class TwilioStatusCallback(BaseModel):
    MessageSid: str
    MessageStatus: str
    To: Optional[str] = None
    From: Optional[str] = None
    ErrorCode: Optional[str] = None
    ErrorMessage: Optional[str] = None

    model_config = {"extra": "allow"}


class SendGridEvent(BaseModel):
    sg_message_id: Optional[str] = None
    event: str
    email: Optional[str] = None
    timestamp: Optional[int] = None
    reason: Optional[str] = None

    model_config = {"extra": "allow"}
