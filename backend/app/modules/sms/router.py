import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_api_key_user
from app.modules.auth.dependencies import get_current_active_user
from app.modules.sms import service
from app.modules.sms.schemas import MessageListResponse, MessageResponse, SmsSendRequest, SmsSendResponse
from app.modules.users.models import User

router = APIRouter(prefix="/v1/sms", tags=["sms"])


@router.post("/send", response_model=SmsSendResponse, status_code=status.HTTP_202_ACCEPTED)
async def send_sms(
    data: SmsSendRequest,
    current_user: User = Depends(get_current_api_key_user),
    db: AsyncSession = Depends(get_db),
) -> SmsSendResponse:
    msg = await service.send_sms(
        db=db,
        user_id=current_user.id,
        to=data.to,
        message=data.message,
        application_id=data.application_id,
    )
    return SmsSendResponse(message_id=msg.id, status=msg.status)


@router.get("/messages", response_model=MessageListResponse)
async def list_messages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> MessageListResponse:
    items, total = await service.list_messages(
        db, current_user.id, "sms", page, page_size
    )
    return MessageListResponse(
        items=[MessageResponse.model_validate(m) for m in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/messages/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    msg = await service.get_message(db, message_id, current_user.id)
    return MessageResponse.model_validate(msg)
