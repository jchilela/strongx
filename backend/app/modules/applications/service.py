import uuid
from typing import Optional

from slugify import slugify
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.applications.models import Application
from app.modules.applications.schemas import ApplicationCreate, ApplicationUpdate


async def _unique_slug(db: AsyncSession, base_slug: str) -> str:
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(select(Application).where(Application.slug == slug))
        if result.scalar_one_or_none() is None:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


async def create_application(
    db: AsyncSession, user_id: uuid.UUID, data: ApplicationCreate
) -> Application:
    base_slug = slugify(data.name, max_length=200, word_boundary=True)
    slug = await _unique_slug(db, base_slug)
    app = Application(
        user_id=user_id,
        name=data.name,
        slug=slug,
        description=data.description,
        status="pending",
    )
    db.add(app)
    await db.flush()
    await db.refresh(app)
    return app


async def list_applications(db: AsyncSession, user_id: uuid.UUID) -> list[Application]:
    result = await db.execute(
        select(Application).where(
            Application.user_id == user_id, Application.is_active == True  # noqa: E712
        )
    )
    return list(result.scalars().all())


async def get_application(
    db: AsyncSession, app_id: uuid.UUID, user_id: uuid.UUID
) -> Application:
    result = await db.execute(
        select(Application).where(
            Application.id == app_id, Application.user_id == user_id
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise NotFoundError("Application not found")
    return app


async def update_application(
    db: AsyncSession, app_id: uuid.UUID, user_id: uuid.UUID, data: ApplicationUpdate
) -> Application:
    app = await get_application(db, app_id, user_id)
    if data.name is not None:
        app.name = data.name
    if data.description is not None:
        app.description = data.description
    await db.flush()
    await db.refresh(app)
    return app


async def delete_application(
    db: AsyncSession, app_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    app = await get_application(db, app_id, user_id)
    app.is_active = False
    await db.flush()


async def check_application_approved(db: AsyncSession, application_id: uuid.UUID) -> None:
    result = await db.execute(select(Application).where(Application.id == application_id))
    app = result.scalar_one_or_none()
    if not app or app.status != "approved":
        from app.core.exceptions import ValidationError
        raise ValidationError("Application is not approved. Awaiting admin approval before sending messages.")
