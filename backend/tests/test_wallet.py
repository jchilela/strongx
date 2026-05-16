"""Tests for wallet: balance, topup, transactions."""
import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.modules.users.models import User
from app.modules.wallet.models import Wallet, WalletTransaction


async def _create_user_with_wallet(
    db: AsyncSession,
    balance: Decimal = Decimal("500.00"),
    phone: str = None,
    email: str = None,
) -> tuple[User, Wallet, str]:
    email = email or f"wallet_{uuid.uuid4().hex[:8]}@test.com"
    phone = phone or f"+244{uuid.uuid4().int % 900000000 + 100000000}"

    user = User(
        full_name="Wallet Test",
        email=email,
        phone=phone,
        password_hash=hash_password("Test@Wallet1!"),
        phone_verified=True,
        email_verified=True,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    wallet = Wallet(user_id=user.id, balance=balance, currency="AOA")
    db.add(wallet)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(user.id)
    return user, wallet, token


@pytest.mark.asyncio
async def test_get_balance(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    user, wallet, token = await _create_user_with_wallet(
        db_session, Decimal("1234.56"), phone="+244910000001"
    )
    await db_session.commit()

    resp = await client.get("/wallet/balance", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert Decimal(data["balance"]) == Decimal("1234.56")
    assert data["currency"] == "AOA"


@pytest.mark.asyncio
async def test_get_balance_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get("/wallet/balance")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_topup_gpo_success(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    user, wallet, token = await _create_user_with_wallet(
        db_session, Decimal("0.00"), phone="+244910000002"
    )
    await db_session.commit()

    # Mock AppyPay token + charge
    fake_appypay_response = {
        "id": "appypay_charge_123",
        "status": "pending",
        "reference": None,
        "entity": None,
        "dueDate": None,
    }

    with patch("app.modules.wallet.service._get_appypay_token", return_value="fake-token"), \
         patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = AsyncMock()
        mock_resp.status_code = 201
        mock_resp.json.return_value = fake_appypay_response
        mock_client_cls.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_resp)

        resp = await client.post(
            "/wallet/topup",
            json={
                "amount": 5000.00,
                "method": "gpo",
                "phone": "923456789",
                "name": "João Silva",
                "email": "joao@test.com",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert resp.status_code == 202, resp.text
    data = resp.json()
    assert "payment_id" in data
    assert "merchant_transaction_id" in data
    assert data["status"] == "pending"
    assert len(data["merchant_transaction_id"]) == 15


@pytest.mark.asyncio
async def test_topup_reference_success(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    user, wallet, token = await _create_user_with_wallet(
        db_session, Decimal("0.00"), phone="+244910000003"
    )
    await db_session.commit()

    fake_appypay_response = {
        "id": "appypay_ref_456",
        "status": "pending",
        "reference": "123456789",
        "entity": "12345",
        "dueDate": "2024-12-31T23:59:59Z",
    }

    with patch("app.modules.wallet.service._get_appypay_token", return_value="fake-token"), \
         patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = AsyncMock()
        mock_resp.status_code = 201
        mock_resp.json.return_value = fake_appypay_response
        mock_client_cls.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_resp)

        resp = await client.post(
            "/wallet/topup",
            json={
                "amount": 10000.00,
                "method": "reference",
                "phone": "923456789",
                "name": "Maria Santos",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

    assert resp.status_code == 202, resp.text
    data = resp.json()
    assert data["reference"] == "123456789"
    assert data["entity"] == "12345"


@pytest.mark.asyncio
async def test_list_transactions(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    user, wallet, token = await _create_user_with_wallet(
        db_session, Decimal("100.00"), phone="+244910000004"
    )

    # Create transactions
    for i in range(5):
        txn = WalletTransaction(
            user_id=user.id,
            type="debit",
            amount=Decimal("5.00"),
            description=f"SMS to test {i}",
            status="completed",
        )
        db_session.add(txn)

    await db_session.commit()

    resp = await client.get("/wallet/transactions", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 5
    assert len(data["items"]) == 5
    assert data["page"] == 1


@pytest.mark.asyncio
async def test_list_transactions_pagination(
    client: AsyncClient, db_session: AsyncSession, fake_redis
) -> None:
    user, wallet, token = await _create_user_with_wallet(
        db_session, Decimal("200.00"), phone="+244910000005"
    )

    for i in range(15):
        txn = WalletTransaction(
            user_id=user.id,
            type="debit",
            amount=Decimal("1.00"),
            description=f"Test {i}",
            status="completed",
        )
        db_session.add(txn)

    await db_session.commit()

    resp = await client.get(
        "/wallet/transactions?page=2&page_size=5",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 15
    assert len(data["items"]) == 5
    assert data["page"] == 2


@pytest.mark.asyncio
async def test_topup_invalid_method(client: AsyncClient, db_session: AsyncSession, fake_redis) -> None:
    user, wallet, token = await _create_user_with_wallet(
        db_session, Decimal("100.00"), phone="+244910000006"
    )
    await db_session.commit()

    resp = await client.post(
        "/wallet/topup",
        json={
            "amount": 5000.00,
            "method": "bitcoin",  # invalid
            "phone": "923456789",
            "name": "Test",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 422
