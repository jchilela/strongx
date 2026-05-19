"""Add telcosms_api_key to applications; create APP-TESTE for all users

Revision ID: 003
Revises: 002
"""
from typing import Sequence, Union
import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_TELCOSMS_KEY = "prda0a684bdabbde776c8bc3dd4d7"


def upgrade() -> None:
    op.add_column(
        "applications",
        sa.Column("telcosms_api_key", sa.String(255), nullable=True),
    )

    # Create APP-TESTE for every user who doesn't already have one
    op.execute(f"""
        INSERT INTO applications (id, user_id, name, slug, description, is_active, status, telcosms_api_key, created_at)
        SELECT
            gen_random_uuid(),
            u.id,
            'APP-TESTE',
            'app-teste-' || substring(u.id::text, 1, 8),
            'Default test application',
            true,
            'approved',
            '{DEFAULT_TELCOSMS_KEY}',
            NOW()
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM applications a
            WHERE a.user_id = u.id AND a.name = 'APP-TESTE'
        )
    """)


def downgrade() -> None:
    op.drop_column("applications", "telcosms_api_key")
