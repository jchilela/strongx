import asyncio
import uuid
from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.redis import redis_dependency
from app.main import fastapi_app

# Use in-memory SQLite for tests (async)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


class FakeRedis:
    """Minimal in-memory Redis mock."""

    def __init__(self):
        self._store: dict[str, Any] = {}
        self._ttls: dict[str, int] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str) -> None:
        self._store[key] = value

    async def setex(self, key: str, ttl: int, value: str) -> None:
        self._store[key] = value
        self._ttls[key] = ttl

    async def delete(self, *keys: str) -> None:
        for k in keys:
            self._store.pop(k, None)

    async def exists(self, key: str) -> int:
        return 1 if key in self._store else 0

    async def incr(self, key: str) -> int:
        val = int(self._store.get(key, 0)) + 1
        self._store[key] = str(val)
        return val

    async def expire(self, key: str, ttl: int) -> None:
        self._ttls[key] = ttl

    async def keys(self, pattern: str) -> list[str]:
        # Simple prefix matching for tests
        prefix = pattern.replace("*", "")
        return [k for k in self._store if k.startswith(prefix)]

    async def aclose(self) -> None:
        pass


@pytest_asyncio.fixture
async def fake_redis() -> FakeRedis:
    return FakeRedis()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession, fake_redis: FakeRedis) -> AsyncGenerator[AsyncClient, None]:
    """HTTP test client with overridden DB and Redis dependencies."""

    async def override_get_db():
        yield db_session

    async def override_redis():
        return fake_redis

    fastapi_app.dependency_overrides[get_db] = override_get_db
    fastapi_app.dependency_overrides[redis_dependency] = override_redis

    # Patch get_redis used directly in service code (must be an async function)
    async def _fake_get_redis():
        return fake_redis

    with patch("app.core.redis.get_redis", side_effect=_fake_get_redis), \
         patch("app.modules.auth.service.get_redis", side_effect=_fake_get_redis), \
         patch("app.modules.sms.service.get_redis", side_effect=_fake_get_redis), \
         patch("app.modules.wallet.service.get_redis", side_effect=_fake_get_redis), \
         patch("app.modules.auth.service._send_otp_sms", new_callable=AsyncMock), \
         patch("app.modules.auth.service._send_verification_email", new_callable=AsyncMock), \
         patch("app.modules.auth.service._send_password_reset_email", new_callable=AsyncMock), \
         patch("app.workers.settings.get_arq_pool") as mock_arq:
        mock_pool = AsyncMock()
        mock_pool.enqueue_job = AsyncMock()
        mock_arq.return_value = mock_pool

        async with AsyncClient(
            transport=ASGITransport(app=fastapi_app), base_url="http://test"
        ) as ac:
            yield ac

    fastapi_app.dependency_overrides.clear()


async def register_and_verify_phone(
    client: AsyncClient,
    fake_redis: FakeRedis,
    phone: str,
    email: str,
    password: str = "Test@Password1!",
    full_name: str = "Test User",
) -> None:
    """
    Register a user and verify their phone via OTP.
    After this, call auth/verify-email endpoint with a generated token to complete registration.
    For test setups that need a fully verified user, prefer creating the User model directly
    in the DB with phone_verified=True, email_verified=True.
    """
    resp = await client.post("/auth/register", json={
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "password": password,
    })
    assert resp.status_code == 201, resp.text

    otp = await fake_redis.get(f"otp:{phone}")
    assert otp is not None, "OTP not stored in fake Redis"

    resp = await client.post("/auth/verify-phone", json={"phone": phone, "otp": otp})
    assert resp.status_code == 200, resp.text
