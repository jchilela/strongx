"""Tests for SMS send endpoint."""
import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, generate_api_key, hash_password
from app.modules.auth.models import ApiKey
from app.modules.sms.models import Message
from app.modules.users.models import User
from app.modules.wallet.models import Wallet


async def _create_user_with_wallet(
    db: AsyncSession,
    balance: Decimal = Decimal("100.00"),
    phone: str = None,
    email: str = None,
) -> tuple[User, Wallet, str]:
    """Create a verified user with a funded wallet. Returns (user, wallet, access_token)."""
    email = email or f"sms_{uuid.uuid4().hex[:8]}@test.com"
    phone = phone or f"+244{uuid.uuid4().int % 900000000 + 100000000}"

    from app.core.security import hash_password

    user = User(
        full_name="SMS Test User",
        email=email,
        phone=phone,
        password_hash=hash_password("Test@Password1!"),
        phone_verified=True,
        email_verified=True,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    wallet = Wallet(user_id=user.id, balance=balance)
    db.add(wallet)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(user.id)
    return user, wallet, token


async def _create_api_key_for_user(db: AsyncSession, user: User) -> str:
    """Create an API key and return the full key."""
    full_key, key_hash, prefix = generate_api_key()
    api_key = ApiKey(
        user_id=user.id,
        name="Test Key",
        key_hash=key_hash,
        key_prefix=prefix,
    )
    db.add(api_key)
    await db.flush()
    return full_key


@pytest.mark.asyncio
async def test_send_sms_success(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    user, wallet, token = await _create_user_with_wallet(
        db_session, Decimal("50.00"), phone="+244900100200"
    )
    await db_session.commit()

    # SMS rate limit key: start clean
    resp = await client.post(
        "/v1/sms/send",
        json={"to": "244900100200", "message": "Hello from StrongX!"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 202, resp.text
    data = resp.json()
    assert "message_id" in data
    assert data["status"] == "queued"

    # Verify message was created
    from sqlalchemy import select
    result = await db_session.execute(
        select(Message).where(Message.user_id == user.id)
    )
    msg = result.scalar_one_or_none()
    assert msg is not None
    assert msg.channel == "sms"
    assert msg.status == "queued"


@pytest.mark.asyncio
async def test_send_sms_insufficient_balance(
    client: AsyncClient, db_session: AsyncSession, fake_redis
) -> None:
    user, wallet, token = await _create_user_with_wallet(
        db_session, Decimal("2.00"), phone="+244900100201"
    )
    await db_session.commit()

    resp = await client.post(
        "/v1/sms/send",
        json={"to": "244900100201", "message": "No balance!"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 402
    assert "Insufficient" in resp.json()["message"]


@pytest.mark.asyncio
async def test_send_sms_with_api_key(
    client: AsyncClient, db_session: AsyncSession, fake_redis
) -> None:
    user, wallet, _ = await _create_user_with_wallet(
        db_session, Decimal("100.00"), phone="+244900100202"
    )
    api_key = await _create_api_key_for_user(db_session, user)
    await db_session.commit()

    resp = await client.post(
        "/v1/sms/send",
        json={"to": "244900100202", "message": "API key auth test"},
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert resp.status_code == 202, resp.text


@pytest.mark.asyncio
async def test_send_sms_unauthorized(client: AsyncClient) -> None:
    resp = await client.post(
        "/v1/sms/send",
        json={"to": "244900100203", "message": "No auth!"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_sms_messages(
    client: AsyncClient, db_session: AsyncSession, fake_redis
) -> None:
    user, wallet, token = await _create_user_with_wallet(
        db_session, Decimal("200.00"), phone="+244900100204"
    )
    # Create some messages
    for i in range(3):
        msg = Message(
            user_id=user.id,
            channel="sms",
            to_address=f"244900{i:06d}",
            message=f"Test message {i}",
            status="sent",
            cost=Decimal("5.00"),
        )
        db_session.add(msg)
    await db_session.flush()
    await db_session.commit()

    resp = await client.get(
        "/v1/sms/messages",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3


@pytest.mark.asyncio
async def test_send_sms_rate_limit(
    client: AsyncClient, db_session: AsyncSession, fake_redis
) -> None:
    user, wallet, token = await _create_user_with_wallet(
        db_session, Decimal("1000.00"), phone="+244900100205"
    )
    await db_session.commit()

    # Pre-fill rate limit counter to trigger it
    await fake_redis.setex(f"rate:sms:{user.id}", 1, "10")

    resp = await client.post(
        "/v1/sms/send",
        json={"to": "244900100205", "message": "Rate limit test"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 429
