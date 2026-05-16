"""Admin features: per-user pricing, application approval

Revision ID: 002
Revises: 001
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("sms_cost", sa.Numeric(10, 4), nullable=True))
    op.add_column("users", sa.Column("email_cost", sa.Numeric(10, 4), nullable=True))
    op.add_column("users", sa.Column("whatsapp_cost", sa.Numeric(10, 4), nullable=True))
    op.add_column("applications", sa.Column("status", sa.String(20), server_default="pending", nullable=False))
    op.add_column("applications", sa.Column("rejected_reason", sa.Text(), nullable=True))
    # All existing applications become approved
    op.execute("UPDATE applications SET status = 'approved'")


def downgrade() -> None:
    op.drop_column("users", "sms_cost")
    op.drop_column("users", "email_cost")
    op.drop_column("users", "whatsapp_cost")
    op.drop_column("applications", "status")
    op.drop_column("applications", "rejected_reason")
