from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_active_user, get_current_api_key_user
from app.modules.email import service
from app.modules.email.schemas import (
    EmailBulkSendRequest,
    EmailBulkSendResponse,
    EmailSendRequest,
    EmailSendResponse,
)
from app.modules.sms.schemas import MessageListResponse, MessageResponse
from app.modules.sms.service import list_messages
from app.modules.users.models import User

router = APIRouter(prefix="/v1/email", tags=["email"])


@router.post("/send", response_model=EmailSendResponse, status_code=status.HTTP_202_ACCEPTED)
async def send_email(
    data: EmailSendRequest,
    current_user: User = Depends(get_current_api_key_user),
    db: AsyncSession = Depends(get_db),
) -> EmailSendResponse:
    msg = await service.send_email(
        db=db,
        user_id=current_user.id,
        to=str(data.to),
        subject=data.subject,
        body_html=data.body_html,
        body_text=data.body_text,
        application_id=data.application_id,
    )
    return EmailSendResponse(message_id=msg.id, status=msg.status)


@router.post("/send-bulk", response_model=EmailBulkSendResponse, status_code=status.HTTP_202_ACCEPTED)
async def send_bulk_email(
    data: EmailBulkSendRequest,
    current_user: User = Depends(get_current_api_key_user),
    db: AsyncSession = Depends(get_db),
) -> EmailBulkSendResponse:
    messages, total_cost = await service.send_bulk_email(
        db=db,
        user_id=current_user.id,
        recipients=[str(r) for r in data.recipients],
        subject=data.subject,
        body_html=data.body_html,
        body_text=data.body_text,
        application_id=data.application_id,
    )
    return EmailBulkSendResponse(
        enqueued=len(messages),
        message_ids=[m.id for m in messages],
        total_cost=float(total_cost),
    )


@router.get("/messages", response_model=MessageListResponse)
async def list_email_messages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> MessageListResponse:
    items, total = await list_messages(db, current_user.id, "email", page, page_size)
    return MessageListResponse(
        items=[MessageResponse.model_validate(m) for m in items],
        total=total,
        page=page,
        page_size=page_size,
    )
