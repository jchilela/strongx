import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.applications import service
from app.modules.applications.schemas import ApplicationCreate, ApplicationUpdate
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.models import User

router = APIRouter(prefix="/v1/applications", tags=["applications"])


def _serialize_app(app) -> dict:
    return {
        "id": str(app.id),
        "name": app.name,
        "slug": app.slug,
        "description": app.description,
        "messageCount": 0,
        "isActive": app.is_active,
        "status": app.status,
        "rejectedReason": app.rejected_reason,
        "createdAt": app.created_at.isoformat(),
        "updatedAt": app.created_at.isoformat(),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_application(
    data: ApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    app = await service.create_application(db, current_user.id, data)
    return {"success": True, "data": _serialize_app(app)}


@router.get("")
async def list_applications(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    apps = await service.list_applications(db, current_user.id)
    return {"success": True, "data": [_serialize_app(a) for a in apps]}


@router.get("/{app_id}")
async def get_application(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    app = await service.get_application(db, app_id, current_user.id)
    return {"success": True, "data": _serialize_app(app)}


@router.put("/{app_id}")
async def update_application(
    app_id: uuid.UUID,
    data: ApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    app = await service.update_application(db, app_id, current_user.id, data)
    return {"success": True, "data": _serialize_app(app)}

