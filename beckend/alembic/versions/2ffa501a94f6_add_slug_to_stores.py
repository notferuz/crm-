"""add slug to stores

Revision ID: 2ffa501a94f6
Revises: 62f50bfe514a
Create Date: 2025-09-17 15:06:36.575801

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2ffa501a94f6'
down_revision: Union[str, Sequence[str], None] = '62f50bfe514a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('stores', sa.Column('slug', sa.String(length=255), nullable=True))
    op.create_index('ix_stores_slug', 'stores', ['slug'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_stores_slug', table_name='stores')
    op.drop_column('stores', 'slug')
