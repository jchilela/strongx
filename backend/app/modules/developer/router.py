import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_active_user
from app.modules.developer import service
from app.modules.developer.schemas import ApiKeyCreateRequest
from app.modules.users.models import User

router = APIRouter(prefix="/v1/api-keys", tags=["developer"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_api_key(
    data: ApiKeyCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    api_key, full_key = await service.create_api_key(
        db, current_user.id, data.name, data.application_id
    )
    return {
        "success": True,
        "data": {
            "apiKey": {
                "id": str(api_key.id),
                "name": api_key.name,
                "prefix": api_key.key_prefix,
                "applicationId": str(api_key.application_id) if api_key.application_id else None,
                "applicationName": None,
                "isActive": api_key.is_active,
                "lastUsedAt": api_key.last_used_at.isoformat() if api_key.last_used_at else None,
                "createdAt": api_key.created_at.isoformat(),
            },
            "fullKey": full_key,
        },
    }


@router.get("")
async def list_api_keys(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    keys = await service.list_api_keys(db, current_user.id)
    return {
        "success": True,
        "data": [
            {
                "id": str(k.id),
                "name": k.name,
                "prefix": k.key_prefix,
                "applicationId": str(k.application_id) if k.application_id else None,
                "applicationName": None,
                "isActive": k.is_active,
                "lastUsedAt": k.last_used_at.isoformat() if k.last_used_at else None,
                "createdAt": k.created_at.isoformat(),
            }
            for k in keys
        ],
    }


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.revoke_api_key(db, key_id, current_user.id)


@router.get("/usage")
async def get_usage(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    stats = await service.get_usage_stats(db, current_user.id)
    return {"success": True, "data": stats}
