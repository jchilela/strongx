from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_active_user, get_current_api_key_user
from app.modules.sms.schemas import MessageListResponse, MessageResponse
from app.modules.sms.service import list_messages
from app.modules.users.models import User
from app.modules.whatsapp import service
from app.modules.whatsapp.schemas import WhatsAppSendRequest, WhatsAppSendResponse

router = APIRouter(prefix="/v1/whatsapp", tags=["whatsapp"])


@router.post("/send", response_model=WhatsAppSendResponse, status_code=status.HTTP_202_ACCEPTED)
async def send_whatsapp(
    data: WhatsAppSendRequest,
    current_user: User = Depends(get_current_api_key_user),
    db: AsyncSession = Depends(get_db),
) -> WhatsAppSendResponse:
    msg = await service.send_whatsapp(
        db=db,
        user_id=current_user.id,
        to=data.to,
        message=data.message,
        application_id=data.application_id,
    )
    return WhatsAppSendResponse(message_id=msg.id, status=msg.status)


@router.get("/messages", response_model=MessageListResponse)
async def list_whatsapp_messages(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> MessageListResponse:
    items, total = await list_messages(db, current_user.id, "whatsapp", page, page_size)
    return MessageListResponse(
        items=[MessageResponse.model_validate(m) for m in items],
        total=total,
        page=page,
        page_size=page_size,
    )
