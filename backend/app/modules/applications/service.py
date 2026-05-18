import uuid
from typing import Optional

from loguru import logger
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
    await _notify_admins_new_application(db, app, user_id)
    return app


async def _notify_admins_new_application(
    db: AsyncSession, app: Application, user_id: uuid.UUID
) -> None:
    from app.modules.users.models import User
    from app.modules.auth.service import _send_email

    creator_result = await db.execute(select(User).where(User.id == user_id))
    creator = creator_result.scalar_one_or_none()
    creator_name = creator.full_name if creator else "Unknown"
    creator_email = creator.email if creator else "Unknown"

    admin_result = await db.execute(
        select(User).where(User.is_admin == True, User.is_active == True)  # noqa: E712
    )
    admins = list(admin_result.scalars().all())
    if not admins:
        return

    subject = f"[StrongX] Nova aplicação pendente: {app.name}"
    html_body = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #6366f1; margin-bottom: 8px;">Nova Aplicação Aguarda Aprovação</h2>
  <p style="color: #374151;">Uma nova aplicação foi submetida e aguarda a sua aprovação.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f9fafb; border-radius: 8px;">
    <tr>
      <td style="padding: 10px 14px; font-weight: bold; color: #374151; width: 140px;">Aplicação:</td>
      <td style="padding: 10px 14px; color: #111827;">{app.name}</td>
    </tr>
    <tr style="background: #fff;">
      <td style="padding: 10px 14px; font-weight: bold; color: #374151;">Submetida por:</td>
      <td style="padding: 10px 14px; color: #111827;">{creator_name} ({creator_email})</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: bold; color: #374151;">Descrição:</td>
      <td style="padding: 10px 14px; color: #111827;">{app.description or '—'}</td>
    </tr>
  </table>
  <a href="https://app.strongx.it.ao/admin/applications"
     style="display: inline-block; background: #6366f1; color: white; padding: 10px 22px;
            text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
    Rever Aplicação
  </a>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">StrongX — Plataforma de Mensagens</p>
</div>
"""
    for admin in admins:
        try:
            await _send_email(admin.email, subject, html_body)
        except Exception as exc:
            logger.error(f"Failed to notify admin {admin.email} about new application: {exc}")


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
