"""Initial schema: all tables + admin seed

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
import os
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Pricing reference (AOA):
# SMS_COST_PER_UNIT = 5.00 AOA
# EMAIL_COST_PER_UNIT = 1.00 AOA
# WHATSAPP_COST_PER_UNIT = 8.00 AOA


def upgrade() -> None:
    # 1. users
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("phone", sa.String(20), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("phone_verified", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("email_verified", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("is_admin", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)

    # 2. applications
    op.create_table(
        "applications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), unique=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"])
    op.create_index("ix_applications_slug", "applications", ["slug"], unique=True)

    # 3. messages
    op.create_table(
        "messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("application_id", UUID(as_uuid=True), sa.ForeignKey("applications.id", ondelete="SET NULL"), nullable=True),
        sa.Column("channel", sa.String(20), nullable=False),
        sa.Column("to_address", sa.String(255), nullable=False),
        sa.Column("from_name", sa.String(255), nullable=True),
        sa.Column("subject", sa.String(500), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), server_default="queued"),
        sa.Column("provider_message_id", sa.String(255), nullable=True),
        sa.Column("cost", sa.Numeric(10, 4), server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_messages_user_id", "messages", ["user_id"])
    op.create_index("ix_messages_application_id", "messages", ["application_id"])
    op.create_index("ix_messages_channel", "messages", ["channel"])

    # 4. api_keys
    op.create_table(
        "api_keys",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("application_id", UUID(as_uuid=True), sa.ForeignKey("applications.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key_hash", sa.String(255), nullable=False),
        sa.Column("key_prefix", sa.String(20), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_api_keys_user_id", "api_keys", ["user_id"])
    op.create_index("ix_api_keys_application_id", "api_keys", ["application_id"])

    # 5. wallets
    op.create_table(
        "wallets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("balance", sa.Numeric(10, 2), server_default="0.00"),
        sa.Column("currency", sa.String(3), server_default="AOA"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_wallets_user_id", "wallets", ["user_id"], unique=True)

    # 6. wallet_transactions
    op.create_table(
        "wallet_transactions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(10), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("reference", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("metadata", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_wallet_transactions_user_id", "wallet_transactions", ["user_id"])

    # 7. payments
    op.create_table(
        "payments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("wallet_transaction_id", UUID(as_uuid=True), sa.ForeignKey("wallet_transactions.id", ondelete="SET NULL"), nullable=True),
        sa.Column("transaction_id", sa.String(255), unique=True, nullable=True),
        sa.Column("merchant_transaction_id", sa.String(15), unique=True, nullable=False),
        sa.Column("method", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), server_default="AOA"),
        sa.Column("customer_name", sa.String(255), nullable=True),
        sa.Column("customer_email", sa.String(255), nullable=True),
        sa.Column("customer_phone", sa.String(20), nullable=True),
        sa.Column("payment_reference", sa.String(255), nullable=True),
        sa.Column("entity_number", sa.String(20), nullable=True),
        sa.Column("provider_id", sa.String(255), nullable=True),
        sa.Column("provider_successful", sa.Boolean(), nullable=True),
        sa.Column("provider_status", sa.String(50), nullable=True),
        sa.Column("provider_code", sa.Integer(), nullable=True),
        sa.Column("provider_message", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("webhook_events", JSONB, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_payments_user_id", "payments", ["user_id"])
    op.create_index("ix_payments_merchant_transaction_id", "payments", ["merchant_transaction_id"], unique=True)
    op.create_index("ix_payments_transaction_id", "payments", ["transaction_id"], unique=True)

    # 8. in_app_notifications
    op.create_table(
        "in_app_notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("type", sa.String(50), server_default="info"),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_in_app_notifications_user_id", "in_app_notifications", ["user_id"])

    # Seed admin user
    _seed_admin(op)


def _seed_admin(op) -> None:
    import uuid
    import bcrypt

    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@StrongX2024!")
    admin_hash = bcrypt.hashpw(admin_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    admin_id = str(uuid.uuid4())
    wallet_id = str(uuid.uuid4())

    op.execute(
        f"""
        INSERT INTO users (id, full_name, email, phone, password_hash, phone_verified, email_verified, is_active, is_admin)
        VALUES (
            '{admin_id}',
            'StrongX Admin',
            'admin@strongx.it.ao',
            '+244900000000',
            '{admin_hash}',
            true,
            true,
            true,
            true
        )
        ON CONFLICT (email) DO NOTHING;
        """
    )

    op.execute(
        f"""
        INSERT INTO wallets (id, user_id, balance, currency)
        SELECT '{wallet_id}', '{admin_id}', 0.00, 'AOA'
        WHERE EXISTS (SELECT 1 FROM users WHERE id = '{admin_id}')
        ON CONFLICT (user_id) DO NOTHING;
        """
    )


def downgrade() -> None:
    op.drop_table("in_app_notifications")
    op.drop_table("payments")
    op.drop_table("wallet_transactions")
    op.drop_table("wallets")
    op.drop_table("api_keys")
    op.drop_table("messages")
    op.drop_table("applications")
    op.drop_table("users")
