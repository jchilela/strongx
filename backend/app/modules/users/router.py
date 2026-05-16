from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_active_user
from app.modules.users.models import User
from app.modules.users.schemas import UserPublic

router = APIRouter(prefix="/v1/settings", tags=["settings"])


@router.get("/me", response_model=UserPublic)
async def get_me(
    current_user: User = Depends(get_current_active_user),
) -> User:
    return current_user
