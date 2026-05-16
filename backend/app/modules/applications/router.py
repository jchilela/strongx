import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.applications import service
from app.modules.applications.schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.models import User

router = APIRouter(prefix="/v1/applications", tags=["applications"])


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    data: ApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    app = await service.create_application(db, current_user.id, data)
    return ApplicationResponse.model_validate(app)


@router.get("/", response_model=list[ApplicationResponse])
async def list_applications(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[ApplicationResponse]:
    apps = await service.list_applications(db, current_user.id)
    return [ApplicationResponse.model_validate(a) for a in apps]


@router.get("/{app_id}", response_model=ApplicationResponse)
async def get_application(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    app = await service.get_application(db, app_id, current_user.id)
    return ApplicationResponse.model_validate(app)


@router.put("/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: uuid.UUID,
    data: ApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    app = await service.update_application(db, app_id, current_user.id, data)
    return ApplicationResponse.model_validate(app)


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.delete_application(db, app_id, current_user.id)
