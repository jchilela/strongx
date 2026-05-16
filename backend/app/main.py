import sys

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.middleware import RequestIDMiddleware, SecurityHeadersMiddleware
from app.core.socket import sio

# Configure loguru
logger.remove()
logger.add(
    sys.stderr,
    format=(
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "{extra[request_id]:<36} | "
        "<level>{message}</level>"
    ),
    level="DEBUG" if settings.DEBUG else "INFO",
    filter=lambda record: record["extra"].setdefault("request_id", "-") or True,
)


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description="StrongX Notification Platform API",
        docs_url="/docs" if settings.APP_ENV != "production" else None,
        redoc_url="/redoc" if settings.APP_ENV != "production" else None,
        openapi_url="/openapi.json" if settings.APP_ENV != "production" else None,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    # Custom middleware (outermost last)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # Exception handlers
    register_exception_handlers(app)

    # Routers
    from app.modules.applications.router import router as applications_router
    from app.modules.auth.router import router as auth_router
    from app.modules.developer.router import router as developer_router
    from app.modules.email.router import router as email_router
    from app.modules.notifications.router import router as notifications_router
    from app.modules.sms.router import router as sms_router
    from app.modules.users.router import router as users_router
    from app.modules.wallet.router import router as wallet_router
    from app.modules.webhooks.router import router as webhooks_router
    from app.modules.whatsapp.router import router as whatsapp_router

    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(applications_router)
    app.include_router(sms_router)
    app.include_router(email_router)
    app.include_router(whatsapp_router)
    app.include_router(wallet_router)
    app.include_router(developer_router)
    app.include_router(webhooks_router)
    app.include_router(notifications_router)

    @app.on_event("startup")
    async def startup() -> None:
        logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode")
        # Initialize Redis pool (warm up)
        from app.core.redis import get_redis

        await get_redis()
        logger.info("Redis connected")

    @app.on_event("shutdown")
    async def shutdown() -> None:
        logger.info("Shutting down")
        from app.core.redis import close_redis

        await close_redis()

        from app.workers.settings import _arq_pool

        if _arq_pool:
            await _arq_pool.aclose()

    @app.get("/health", tags=["health"])
    async def health() -> dict:
        return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}

    return app


fastapi_app = create_app()

# Mount Socket.IO alongside FastAPI
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
