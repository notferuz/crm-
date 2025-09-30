"""update userrole enum

Revision ID: 99_update_userrole_enum
Revises: 98a16557f250
Create Date: 2025-07-05 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '99_update_userrole_enum'
down_revision = '98a16557f250'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Rename the old type
    op.execute("ALTER TYPE userrole RENAME TO userrole_old;")
    # 2. Create the new type
    op.execute("""
        CREATE TYPE userrole AS ENUM ('superadmin', 'store_admin', 'staff', 'viewer', 'client');
    """)
    # 3. Alter the column to use the new type
    op.execute("""
        ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::text::userrole;
    """)
    # 4. Drop the old type
    op.execute("DROP TYPE userrole_old;")

def downgrade():
    # 1. Rename the new type
    op.execute("ALTER TYPE userrole RENAME TO userrole_new;")
    # 2. Recreate the old type (only 'superadmin', 'admin', 'staff', 'viewer')
    op.execute("""
        CREATE TYPE userrole AS ENUM ('superadmin', 'admin', 'staff', 'viewer');
    """)
    # 3. Alter the column to use the old type
    op.execute("""
        ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::text::userrole;
    """)
    # 4. Drop the new type
    op.execute("DROP TYPE userrole_new;") 