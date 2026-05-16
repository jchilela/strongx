"""Tests for auth module: register, OTP verify, email verify, login."""
import uuid
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_email_verify_token, hash_password
from app.modules.users.models import User
from app.modules.wallet.models import Wallet


async def _register_user(client: AsyncClient, phone: str, email: str, password: str = "Test@Password1!") -> None:
    resp = await client.post("/auth/register", json={
        "full_name": "Test User",
        "email": email,
        "phone": phone,
        "password": password,
    })
    assert resp.status_code == 201, resp.text
    assert "OTP" in resp.json()["message"]


async def _make_verified_user(
    db: AsyncSession,
    fake_redis,
    email: str = None,
    phone: str = None,
    password: str = "Test@Password1!",
) -> User:
    """Create a fully verified user directly in DB (bypasses email/SMS)."""
    email = email or f"u_{uuid.uuid4().hex[:8]}@test.com"
    phone = phone or f"+244{uuid.uuid4().int % 900000000 + 100000000}"
    user = User(
        full_name="Test User",
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        phone_verified=True,
        email_verified=True,
        is_active=True,
    )
    db.add(user)
    wallet = Wallet(user_id=user.id)
    db.add(wallet)
    await db.flush()
    await db.refresh(user)
    return user


@pytest.mark.asyncio
async def test_register_creates_user(client: AsyncClient, fake_redis) -> None:
    phone = "+244911111111"
    email = "reg_test@test.com"
    resp = await client.post("/auth/register", json={
        "full_name": "John Doe",
        "email": email,
        "phone": phone,
        "password": "SecurePass@1!",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "message" in data


@pytest.mark.asyncio
async def test_register_duplicate_email_fails(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    email = "dup@test.com"
    user = await _make_verified_user(db_session, fake_redis, email=email, phone="+244922222220")
    await db_session.commit()

    resp = await client.post("/auth/register", json={
        "full_name": "Another",
        "email": email,
        "phone": "+244922222299",
        "password": "SecurePass@1!",
    })
    assert resp.status_code == 409
    assert "Email" in resp.json()["message"]


@pytest.mark.asyncio
async def test_verify_phone_with_correct_otp(client: AsyncClient, fake_redis) -> None:
    phone = "+244933333333"
    email = "vptest@test.com"

    await client.post("/auth/register", json={
        "full_name": "VP Test",
        "email": email,
        "phone": phone,
        "password": "SecurePass@1!",
    })

    # OTP is stored in fake_redis
    otp = await fake_redis.get(f"otp:{phone}")
    assert otp is not None

    resp = await client.post("/auth/verify-phone", json={"phone": phone, "otp": otp})
    assert resp.status_code == 200
    assert "Phone verified" in resp.json()["message"]

    # OTP should be deleted
    assert await fake_redis.get(f"otp:{phone}") is None


@pytest.mark.asyncio
async def test_verify_phone_wrong_otp(client: AsyncClient, fake_redis) -> None:
    phone = "+244944444444"
    await client.post("/auth/register", json={
        "full_name": "Wrong OTP",
        "email": "wrongotp@test.com",
        "phone": phone,
        "password": "SecurePass@1!",
    })

    resp = await client.post("/auth/verify-phone", json={"phone": phone, "otp": "000000"})
    assert resp.status_code == 422
    assert "Invalid" in resp.json()["message"]


@pytest.mark.asyncio
async def test_verify_email_with_valid_token(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    user = await _make_verified_user(db_session, fake_redis, email="emailverify@test.com", phone="+244955555555")
    user.email_verified = False
    await db_session.flush()

    token = create_email_verify_token(user.id)
    resp = await client.get(f"/auth/verify-email?token={token}")
    assert resp.status_code == 200
    assert "Email verified" in resp.json()["message"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    password = "Test@Login1!"
    user = await _make_verified_user(db_session, fake_redis, password=password, phone="+244966666666")
    await db_session.commit()

    # Store refresh token helper in Redis (simulated)
    with patch("app.modules.auth.service.get_redis", return_value=fake_redis):
        resp = await client.post("/auth/login", json={"email": user.email, "password": password})

    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == user.email


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    user = await _make_verified_user(db_session, fake_redis, phone="+244977777777")
    await db_session.commit()

    resp = await client.post("/auth/login", json={"email": user.email, "password": "WrongPass@1!"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unverified_phone_blocked(client: AsyncClient, fake_redis) -> None:
    phone = "+244988888888"
    email = "unverified@test.com"
    password = "SecurePass@1!"

    await client.post("/auth/register", json={
        "full_name": "Unverified",
        "email": email,
        "phone": phone,
        "password": password,
    })

    resp = await client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 403
    assert "Phone" in resp.json()["message"] or "phone" in resp.json()["message"]


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    password = "Test@Refresh1!"
    user = await _make_verified_user(db_session, fake_redis, password=password, phone="+244999999990")
    await db_session.commit()

    # Login to get tokens
    login_resp = await client.post("/auth/login", json={"email": user.email, "password": password})
    assert login_resp.status_code == 200
    refresh_token = login_resp.json()["refresh_token"]

    # Use refresh token
    resp = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_resend_otp_rate_limit(client: AsyncClient, fake_redis) -> None:
    phone = "+244900111222"
    # Simulate already at rate limit (3 requests)
    await fake_redis.setex(f"otp_rate:{phone}", 3600, "3")

    resp = await client.post("/auth/resend-otp", json={"phone": phone})
    assert resp.status_code == 429
