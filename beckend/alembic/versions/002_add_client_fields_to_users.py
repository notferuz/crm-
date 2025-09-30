"""add client fields to users

Revision ID: 002_add_client_fields_to_users
Revises: 001_add_equipment_status_fields
Create Date: 2024-06-09
"""
from alembic import op
import sqlalchemy as sa

revision = '002_add_client_fields_to_users'
down_revision = '001_add_equipment_status_fields'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('birth_date', sa.Date(), nullable=True))
    op.add_column('users', sa.Column('passport_number', sa.String(), nullable=True))
    op.add_column('users', sa.Column('organization', sa.String(), nullable=True))
    op.add_column('users', sa.Column('trusted_person_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('trusted_person_phone', sa.String(), nullable=True))

def downgrade():
    op.drop_column('users', 'trusted_person_phone')
    op.drop_column('users', 'trusted_person_name')
    op.drop_column('users', 'organization')
    op.drop_column('users', 'passport_number')
    op.drop_column('users', 'birth_date') 