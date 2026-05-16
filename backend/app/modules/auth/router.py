from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth import service
from app.modules.auth.dependencies import get_current_active_user
from app.modules.auth.schemas import (
    AccessTokenResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResendOtpRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyPhoneRequest,
)
from app.modules.users.models import User

router = APIRouter(prefix="/v1/auth", tags=["auth"])


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    msg = await service.register_user(
        db,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password=data.password,
    )
    return MessageResponse(message=msg)


@router.post("/verify-phone", response_model=MessageResponse)
async def verify_phone(
    data: VerifyPhoneRequest, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    msg = await service.verify_phone(db, data.phone, data.otp)
    return MessageResponse(message=msg)


@router.get("/verify-email", response_model=MessageResponse)
async def verify_email_get(
    token: str = Query(...), db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    msg = await service.verify_email(db, token)
    return MessageResponse(message=msg)


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email_post(
    data: dict, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    token = data.get("token", "")
    msg = await service.verify_email(db, token)
    return MessageResponse(message=msg)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await service.login_user(db, data.email, data.password)
    return TokenResponse(**result)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(data: RefreshRequest) -> AccessTokenResponse:
    result = await service.refresh_tokens(data.refresh_token)
    return AccessTokenResponse(**result)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_active_user),
) -> MessageResponse:
    await service.logout_user(current_user.id)
    return MessageResponse(message="Logged out successfully")


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(data: ResendOtpRequest) -> MessageResponse:
    msg = await service.resend_otp(data.phone)
    return MessageResponse(message=msg)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    msg = await service.forgot_password(db, data.email)
    return MessageResponse(message=msg)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    msg = await service.reset_password(db, data.token, data.new_password)
    return MessageResponse(message=msg)


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_active_user)) -> dict:
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "phone_verified": current_user.phone_verified,
        "email_verified": current_user.email_verified,
        "is_admin": current_user.is_admin,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }
