import math

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_active_user, get_api_key_context, ApiKeyContext
from app.modules.email import service
from app.modules.email.schemas import EmailBulkSendRequest, EmailSendRequest
from app.modules.sms.router import _serialize_message
from app.modules.sms.service import list_messages
from app.modules.users.models import User

router = APIRouter(prefix="/v1/email", tags=["email"])


@router.post("/send", status_code=status.HTTP_202_ACCEPTED)
async def send_email(
    data: EmailSendRequest,
    ctx: ApiKeyContext = Depends(get_api_key_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    msg = await service.send_email(
        db=db,
        user_id=ctx.user.id,
        to=str(data.to),
        subject=data.subject,
        body_html=data.body_html,
        body_text=data.body_text,
        application_id=data.application_id or ctx.application_id,
    )
    return {"success": True, "data": {"messageId": str(msg.id), "status": msg.status}}


@router.post("/send-bulk", status_code=status.HTTP_202_ACCEPTED)
async def send_bulk_email(
    data: EmailBulkSendRequest,
    ctx: ApiKeyContext = Depends(get_api_key_context),
    db: AsyncSession = Depends(get_db),
) -> dict:
    messages, total_cost = await service.send_bulk_email(
        db=db,
        user_id=ctx.user.id,
        recipients=[str(r) for r in data.recipients],
        subject=data.subject,
        body_html=data.body_html,
        body_text=data.body_text,
        application_id=data.application_id or ctx.application_id,
    )
    return {
        "success": True,
        "data": {
            "sent": len(messages),
            "failed": 0,
        },
    }


@router.get("/messages")
async def list_email_messages(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    items, total = await list_messages(db, current_user.id, "email", page, limit)
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
