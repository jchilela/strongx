import math

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_active_user, get_api_key_context, ApiKeyContext
from app.modules.sms.router import _serialize_message
from app.modules.sms.service import list_messages
from app.modules.users.models import User
from app.modules.whatsapp import service
from app.modules.whatsapp.schemas import WhatsAppSendRequest

router = APIRouter(prefix="/v1/whatsapp", tags=["whatsapp"])


@router.post("/send", status_code=status.HTTP_202_ACCEPTED)
async def send_whatsapp(
    data: WhatsAppSendRequest,
    ctx: ApiKeyContext = Depends(get_api_key_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    msg = await service.send_whatsapp(
        db=db,
        user_id=ctx.user.id,
        to=data.to,
        message=data.message,
        application_id=data.application_id or ctx.application_id,
    )
    return {"success": True, "data": {"messageId": str(msg.id), "status": msg.status}}


@router.get("/messages")
async def list_whatsapp_messages(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    items, total = await list_messages(db, current_user.id, "whatsapp", page, limit)
    return {
        "success": True,
        "data": {
            "messages": [_serialize_message(m) for m in items],
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": math.ceil(total / limit) if total > 0 else 1,
        },
    }
