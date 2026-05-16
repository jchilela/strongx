from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    full_name: str = Field(..., min_length=2, max_length=255, alias="name")
    email: EmailStr
    phone: str = Field(..., pattern=r"^\+?244\d{9}$", description="Angola phone: +244XXXXXXXXX")
    password: str = Field(..., min_length=8, max_length=128)


class VerifyPhoneRequest(BaseModel):
    phone: str
    otp: str = Field(..., min_length=6, max_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    refresh_token: str = Field(..., alias="refreshToken")


class ResendOtpRequest(BaseModel):
    phone: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    token: str
    new_password: str = Field(..., min_length=8, max_length=128, alias="password")


class UserData(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    emailVerified: bool
    phoneVerified: bool


class TokensData(BaseModel):
    accessToken: str
    refreshToken: str
    expiresIn: int


class LoginData(BaseModel):
    user: UserData
    tokens: TokensData


class TokenResponse(BaseModel):
    success: bool = True
    data: LoginData


class AccessTokenResponse(BaseModel):
    success: bool = True
    data: TokensData


class MessageResponse(BaseModel):
    message: str
