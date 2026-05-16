import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str


class UserPublic(UserBase):
    id: uuid.UUID
    phone_verified: bool
    email_verified: bool
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserInDB(UserPublic):
    password_hash: str
