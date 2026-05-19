import uuid
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_admin_user
from app.modules.users.models import User
from app.modules.admin import service

router = APIRouter(prefix="/v1/admin", tags=["admin"])


def _serialize_user(u: User) -> dict:
    return {
        "id": str(u.id),
        "name": u.full_name,
        "email": u.email,
        "phone": u.phone,
        "isActive": u.is_active,
        "isAdmin": u.is_admin,
        "emailVerified": u.email_verified,
        "phoneVerified": u.phone_verified,
        "smsCost": float(u.sms_cost) if u.sms_cost is not None else None,
        "emailCost": float(u.email_cost) if u.email_cost is not None else None,
        "whatsappCost": float(u.whatsapp_cost) if u.whatsapp_cost is not None else None,
        "createdAt": u.created_at.isoformat(),
    }


def _serialize_app(app) -> dict:
    return {
        "id": str(app.id),
        "userId": str(app.user_id),
        "name": app.name,
        "slug": app.slug,
        "description": app.description,
        "status": app.status,
        "rejectedReason": app.rejected_reason,
        "isActive": app.is_active,
        "telcosmsApiKey": app.telcosms_api_key,
        "createdAt": app.created_at.isoformat(),
    }


def _serialize_key(k) -> dict:
    return {
        "id": str(k.id),
        "name": k.name,
        "prefix": k.key_prefix,
        "applicationId": str(k.application_id) if k.application_id else None,
        "isActive": k.is_active,
        "lastUsedAt": k.last_used_at.isoformat() if k.last_used_at else None,
        "createdAt": k.created_at.isoformat(),
    }


class UpdateUserRequest(BaseModel):
    isActive: Optional[bool] = None
    isAdmin: Optional[bool] = None
    smsCost: Optional[Decimal] = None
    emailCost: Optional[Decimal] = None
    whatsappCost: Optional[Decimal] = None


class ApproveRequest(BaseModel):
    telcosmsApiKey: Optional[str] = None


class RejectRequest(BaseModel):
    reason: str


class ToggleKeyRequest(BaseModel):
    isActive: bool


class AddFundsRequest(BaseModel):
    amount: Decimal
    description: str = "Admin credit"


@router.get("/users")
async def list_users(
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    rows = await service.list_users(db)
    data = []
    for user, wallet in rows:
        d = _serialize_user(user)
        d["walletBalance"] = float(wallet.balance) if wallet else 0.0
        data.append(d)
    return {"success": True, "data": data}


@router.get("/users/{user_id}")
async def get_user(
    user_id: uuid.UUID,
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    user = await service.get_user(db, user_id)
    return {"success": True, "data": _serialize_user(user)}


@router.put("/users/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    data: UpdateUserRequest,
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    updates = data.model_dump(exclude_unset=True)
    user = await service.update_user(db, user_id, updates)
    await db.commit()
    return {"success": True, "data": _serialize_user(user)}


@router.get("/users/{user_id}/api-keys")
async def list_user_api_keys(
    user_id: uuid.UUID,
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    keys = await service.list_user_api_keys(db, user_id)
    return {"success": True, "data": [_serialize_key(k) for k in keys]}


@router.put("/api-keys/{key_id}")
async def toggle_api_key(
    key_id: uuid.UUID,
    data: ToggleKeyRequest,
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    key = await service.toggle_api_key(db, key_id, data.isActive)
    await db.commit()
    return {"success": True, "data": _serialize_key(key)}


@router.get("/applications")
async def list_applications(
    status: Optional[str] = Query(None),
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    apps = await service.list_applications(db, status=status)
    return {"success": True, "data": [_serialize_app(a) for a in apps]}


@router.post("/applications/{app_id}/approve")
async def approve_application(
    app_id: uuid.UUID,
    data: ApproveRequest,
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    app = await service.approve_application(db, app_id, telcosms_api_key=data.telcosmsApiKey)
    await db.commit()
    return {"success": True, "data": _serialize_app(app)}


@router.post("/applications/{app_id}/reject")
async def reject_application(
    app_id: uuid.UUID,
    data: RejectRequest,
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    app = await service.reject_application(db, app_id, data.reason)
    await db.commit()
    return {"success": True, "data": _serialize_app(app)}


@router.post("/users/{user_id}/wallet/add")
async def add_wallet_funds(
    user_id: uuid.UUID,
    data: AddFundsRequest,
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await service.admin_add_wallet_funds(db, user_id, data.amount, data.description)
    await db.commit()
    return {"success": True, "data": result}


@router.get("/stats/earnings")
async def get_earnings_stats(
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    stats = await service.get_earnings_stats(db)
    return {"success": True, "data": stats}


@router.get("/stats/wallets")
async def get_wallet_summary(
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    summary = await service.get_wallet_summary(db)
    return {"success": True, "data": summary}


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: uuid.UUID,
    _: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    new_password = await service.reset_user_password(db, user_id)
    await db.commit()
    return {"success": True, "data": {"newPassword": new_password}}
