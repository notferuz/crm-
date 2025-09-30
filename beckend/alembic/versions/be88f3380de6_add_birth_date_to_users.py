"""Add birth_date to users

Revision ID: be88f3380de6
Revises: 002_add_client_fields_to_users
Create Date: 2025-07-03 07:28:32.509513

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'be88f3380de6'
down_revision: Union[str, Sequence[str], None] = '002_add_client_fields_to_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.
    This migration originally tried to add 'birth_date',
    but the previous migration already adds it. Make it idempotent.
    """
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS birth_date")
