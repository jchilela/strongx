import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_active_user
from app.modules.developer import service
from app.modules.developer.schemas import (
    ApiKeyCreateRequest,
    ApiKeyCreateResponse,
    ApiKeyResponse,
    UsageStats,
)
from app.modules.users.models import User

router = APIRouter(prefix="/v1/api-keys", tags=["developer"])


@router.post("/", response_model=ApiKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    data: ApiKeyCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyCreateResponse:
    api_key, full_key = await service.create_api_key(
        db, current_user.id, data.name, data.application_id
    )
    return ApiKeyCreateResponse(
        id=api_key.id,
        name=api_key.name,
        key=full_key,
        prefix=api_key.key_prefix,
        application_id=api_key.application_id,
        created_at=api_key.created_at,
    )


@router.get("/", response_model=list[ApiKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[ApiKeyResponse]:
    keys = await service.list_api_keys(db, current_user.id)
    return [ApiKeyResponse.model_validate(k) for k in keys]


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.revoke_api_key(db, key_id, current_user.id)


@router.get("/usage", response_model=list[UsageStats])
async def get_usage(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[UsageStats]:
    return await service.get_usage_stats(db, current_user.id)
