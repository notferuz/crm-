"""add webapp fields to store

Revision ID: 90576dfd9870
Revises: 2ffa501a94f6
Create Date: 2025-09-17 17:14:15.475681

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90576dfd9870'
down_revision: Union[str, Sequence[str], None] = '2ffa501a94f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('stores', sa.Column('logo_url', sa.String(length=500), nullable=True))
    op.add_column('stores', sa.Column('about_html', sa.Text(), nullable=True))
    op.add_column('stores', sa.Column('map_iframe', sa.Text(), nullable=True))
    op.add_column('stores', sa.Column('telegram', sa.String(length=255), nullable=True))
    op.add_column('stores', sa.Column('instagram', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('stores', 'instagram')
    op.drop_column('stores', 'telegram')
    op.drop_column('stores', 'map_iframe')
    op.drop_column('stores', 'about_html')
    op.drop_column('stores', 'logo_url')
