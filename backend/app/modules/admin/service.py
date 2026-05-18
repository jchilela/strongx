import uuid
import secrets
import string
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.users.models import User
from app.modules.applications.models import Application
from app.modules.auth.models import ApiKey
from app.modules.wallet.models import Wallet, WalletTransaction
from app.core.exceptions import NotFoundError
from app.core.security import hash_password


async def list_users(db: AsyncSession) -> list[User]:
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    return user


async def update_user(db: AsyncSession, user_id: uuid.UUID, updates: dict) -> User:
    user = await get_user(db, user_id)
    field_map = {
        "isActive": "is_active",
        "isAdmin": "is_admin",
        "smsCost": "sms_cost",
        "emailCost": "email_cost",
        "whatsappCost": "whatsapp_cost",
    }
    for key, db_field in field_map.items():
        if key in updates:
            setattr(user, db_field, updates[key])
    await db.flush()
    return user


async def list_user_api_keys(db: AsyncSession, user_id: uuid.UUID) -> list[ApiKey]:
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user_id).order_by(ApiKey.created_at.desc())
    )
    return list(result.scalars().all())


async def toggle_api_key(db: AsyncSession, key_id: uuid.UUID, is_active: bool) -> ApiKey:
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    key = result.scalar_one_or_none()
    if not key:
        raise NotFoundError("API key not found")
    key.is_active = is_active
    await db.flush()
    return key


async def list_applications(db: AsyncSession, status: Optional[str] = None) -> list[Application]:
    q = select(Application).order_by(Application.created_at.desc())
    if status:
        q = q.where(Application.status == status)
    result = await db.execute(q)
    return list(result.scalars().all())


async def approve_application(db: AsyncSession, app_id: uuid.UUID) -> Application:
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise NotFoundError("Application not found")
    app.status = "approved"
    app.rejected_reason = None
    await db.flush()
    return app


async def reject_application(db: AsyncSession, app_id: uuid.UUID, reason: str) -> Application:
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise NotFoundError("Application not found")
    app.status = "rejected"
    app.rejected_reason = reason
    await db.flush()
    return app


async def admin_add_wallet_funds(
    db: AsyncSession, user_id: uuid.UUID, amount: Decimal, description: str
) -> dict:
    result = await db.execute(
        select(Wallet).where(Wallet.user_id == user_id).with_for_update()
    )
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise NotFoundError("Wallet not found for user")
    wallet.balance += amount
    txn = WalletTransaction(
        user_id=user_id,
        type="credit",
        amount=amount,
        description=description or "Admin credit",
        status="completed",
    )
    db.add(txn)
    await db.flush()
    return {"balance": float(wallet.balance), "added": float(amount)}


async def get_earnings_stats(db: AsyncSession) -> dict:
    # Daily — last 30 days
    daily_q = await db.execute(text("""
        SELECT DATE(created_at AT TIME ZONE 'UTC') as day, COALESCE(SUM(amount), 0) as total
        FROM wallet_transactions
        WHERE type = 'debit' AND status = 'completed'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day ORDER BY day
    """))
    daily = [{"date": str(r.day), "total": float(r.total)} for r in daily_q]

    # Monthly — last 12 months
    monthly_q = await db.execute(text("""
        SELECT TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), 'YYYY-MM') as month,
               COALESCE(SUM(amount), 0) as total
        FROM wallet_transactions
        WHERE type = 'debit' AND status = 'completed'
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month ORDER BY month
    """))
    monthly = [{"month": r.month, "total": float(r.total)} for r in monthly_q]

    # Yearly — all time
    yearly_q = await db.execute(text("""
        SELECT TO_CHAR(DATE_TRUNC('year', created_at AT TIME ZONE 'UTC'), 'YYYY') as year,
               COALESCE(SUM(amount), 0) as total
        FROM wallet_transactions
        WHERE type = 'debit' AND status = 'completed'
        GROUP BY year ORDER BY year
    """))
    yearly = [{"year": r.year, "total": float(r.total)} for r in yearly_q]

    # Top users
    top_users_q = await db.execute(text("""
        SELECT u.id::text, u.full_name as name, u.email, COALESCE(SUM(wt.amount), 0) as total
        FROM wallet_transactions wt
        JOIN users u ON u.id = wt.user_id
        WHERE wt.type = 'debit' AND wt.status = 'completed'
        GROUP BY u.id, u.full_name, u.email
        ORDER BY total DESC
        LIMIT 10
    """))
    top_users = [
        {"userId": r.id, "name": r.name, "email": r.email, "total": float(r.total)}
        for r in top_users_q
    ]

    # Total all time
    total_q = await db.execute(text("""
        SELECT COALESCE(SUM(amount), 0) as total
        FROM wallet_transactions
        WHERE type = 'debit' AND status = 'completed'
    """))
    total_all_time = float(total_q.scalar_one())

    return {
        "daily": daily,
        "monthly": monthly,
        "yearly": yearly,
        "topUsers": top_users,
        "totalAllTime": total_all_time,
    }


async def get_wallet_summary(db: AsyncSession) -> dict:
    """Total balance across all user wallets and total earned (debits)."""
    total_balance_q = await db.execute(
        select(func.coalesce(func.sum(Wallet.balance), 0))
    )
    total_balance = float(total_balance_q.scalar_one())

    total_earned_q = await db.execute(text("""
        SELECT COALESCE(SUM(amount), 0) as total
        FROM wallet_transactions
        WHERE type = 'debit' AND status = 'completed'
    """))
    total_earned = float(total_earned_q.scalar_one())

    user_count_q = await db.execute(
        select(func.count(Wallet.id)).where(Wallet.balance > 0)
    )
    users_with_funds = int(user_count_q.scalar_one())

    return {
        "totalWalletBalance": total_balance,
        "totalEarned": total_earned,
        "usersWithFunds": users_with_funds,
    }


async def reset_user_password(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Generate a new random password for a user and return it in plain text."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    alphabet = string.ascii_letters + string.digits + "!@#$"
    new_password = (
        secrets.choice(string.ascii_uppercase)
        + secrets.choice(string.digits)
        + secrets.choice("!@#$")
        + "".join(secrets.choice(alphabet) for _ in range(9))
    )
    user.password_hash = hash_password(new_password)
    await db.flush()
    return new_password
