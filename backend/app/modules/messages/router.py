from datetime import date, timedelta, timezone, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import get_current_active_user
from app.modules.sms.models import Message
from app.modules.wallet.models import Wallet
from app.modules.users.models import User

router = APIRouter(prefix="/v1/messages", tags=["messages"])


@router.get("/recent")
async def get_recent_messages(
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    stmt = (
        select(Message)
        .where(Message.user_id == current_user.id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()

    return {
        "success": True,
        "data": [
            {
                "id": str(m.id),
                "channel": m.channel,
                "to": m.to_address,
                "subject": m.subject,
                "body": m.message,
                "status": m.status,
                "cost": float(m.cost),
                "applicationId": str(m.application_id) if m.application_id else None,
                "applicationName": None,
                "createdAt": m.created_at.isoformat(),
                "updatedAt": m.updated_at.isoformat(),
            }
            for m in messages
        ],
    }


@router.get("/stats/today")
async def get_today_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    today = date.today()

    stmt = (
        select(Message.channel, func.count().label("cnt"))
        .where(
            Message.user_id == current_user.id,
            func.date(Message.created_at) == today,
        )
        .group_by(Message.channel)
    )
    result = await db.execute(stmt)
    counts = {row.channel: row.cnt for row in result}

    wallet_stmt = select(Wallet.balance).where(Wallet.user_id == current_user.id)
    wallet_result = await db.execute(wallet_stmt)
    balance = wallet_result.scalar_one_or_none() or 0

    return {
        "success": True,
        "data": {
            "smsSentToday": counts.get("sms", 0),
            "emailsSentToday": counts.get("email", 0),
            "whatsappSentToday": counts.get("whatsapp", 0),
            "walletBalance": float(balance),
        },
    }


@router.get("/stats/daily")
async def get_daily_stats(
    days: int = Query(default=7, ge=1, le=90),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    since = date.today() - timedelta(days=days - 1)

    stmt = (
        select(
            func.date(Message.created_at).label("day"),
            Message.channel,
            func.count().label("cnt"),
        )
        .where(
            Message.user_id == current_user.id,
            func.date(Message.created_at) >= since,
        )
        .group_by(func.date(Message.created_at), Message.channel)
        .order_by(func.date(Message.created_at))
    )
    result = await db.execute(stmt)
    rows = result.all()

    # Build a dict keyed by date
    by_date: dict[str, dict] = {}
    for row in rows:
        d = str(row.day)
        if d not in by_date:
            by_date[d] = {"date": d, "sms": 0, "email": 0, "whatsapp": 0}
        by_date[d][row.channel] = row.cnt

    # Fill missing days with zeros
    stats = []
    for i in range(days):
        d = str(since + timedelta(days=i))
        stats.append(by_date.get(d, {"date": d, "sms": 0, "email": 0, "whatsapp": 0}))

    return {"success": True, "data": stats}
