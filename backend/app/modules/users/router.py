from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.core.exceptions import ValidationError
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.models import User

router = APIRouter(prefix="/v1/settings", tags=["settings"])


class UpdateProfileRequest(BaseModel):
    name: str


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_active_user)) -> dict:
    return {
        "success": True,
        "data": {
            "id": str(current_user.id),
            "name": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone,
            "phoneVerified": current_user.phone_verified,
            "emailVerified": current_user.email_verified,
        },
    }


@router.put("/profile")
async def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    current_user.full_name = data.name
    await db.flush()
    return {
        "success": True,
        "data": {
            "id": str(current_user.id),
            "name": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone,
            "phoneVerified": current_user.phone_verified,
            "emailVerified": current_user.email_verified,
        },
    }


@router.put("/password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not verify_password(data.currentPassword, current_user.password_hash):
        raise ValidationError("Current password is incorrect")
    if data.newPassword != data.confirmPassword:
        raise ValidationError("New passwords do not match")
    current_user.password_hash = hash_password(data.newPassword)
    await db.flush()
    return {"success": True, "data": None}


@router.get("/notifications")
async def get_notification_preferences(
    current_user: User = Depends(get_current_active_user),
) -> dict:
    return {
        "success": True,
        "data": {
            "emailOnDelivery": False,
            "emailOnFailure": True,
            "smsOnLowBalance": False,
            "lowBalanceThreshold": 100,
            "weeklyReport": False,
        },
    }


@router.put("/notifications")
async def update_notification_preferences(
    data: dict,
    current_user: User = Depends(get_current_active_user),
) -> dict:
    return {"success": True, "data": data}
