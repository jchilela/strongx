from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "StrongX"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me"
    FRONTEND_URL: str = "https://app.strongx.it.ao"
    API_URL: str = "https://api.strongx.it.ao"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://strongx:strongx@localhost:5432/strongx"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # TelcoSMS
    TELCOSMS_URL: str = "https://telcosms.co.ao/send_message"
    TELCOSMS_API_KEY: str = ""
    TELCOSMS_FROM: str = "StrongX"

    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = ""
    TWILIO_SENDGRID_API_KEY: str = ""

    # SMTP (Gmail or any SMTP provider)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "StrongX"

    # AppyPay
    APPYPAY_TOKEN_URL: str = (
        "https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token"
    )
    APPYPAY_CLIENT_ID: str = ""
    APPYPAY_CLIENT_SECRET: str = ""
    APPYPAY_RESOURCE: str = ""
    APPYPAY_BASE_URL: str = "https://gwy-api.appypay.co.ao"
    APPYPAY_PAYMENT_METHOD_GPO: str = ""
    APPYPAY_PAYMENT_METHOD_REFERENCE: str = ""
    APPYPAY_WEBHOOK_TOKEN: str = ""

    # Pricing (AOA)
    SMS_COST_PER_UNIT: float = 5.00
    EMAIL_COST_PER_UNIT: float = 1.00
    WHATSAPP_COST_PER_UNIT: float = 8.00

    # Admin seed
    ADMIN_PASSWORD: str = "Admin@StrongX2024!"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
