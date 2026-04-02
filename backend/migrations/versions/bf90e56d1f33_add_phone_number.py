"""add_phone_number

Revision ID: bf90e56d1f33
Revises: 
Create Date: 2026-02-09 21:18:32.278175

"""
from typing import Sequence, Union


from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'bf90e56d1f33'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create User table
    # We include 'department' here because the NEXT migration (a1b2c3d4e5f6) 
    # expects it to exist so it can migrate it to the 'departments' JSON array.
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('username', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('email', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('full_name', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('hashed_password', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('disabled', sa.Boolean(), nullable=True),
        sa.Column('role', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('department', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('phone_number', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_username'), 'user', ['username'], unique=True)

    # 2. Create KPIRecord table
    op.create_table(
        'kpirecord',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('department', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('subtype', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('metric_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_kpirecord_date'), 'kpirecord', ['date'], unique=False)
    op.create_index(op.f('ix_kpirecord_department'), 'kpirecord', ['department'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_kpirecord_department'), table_name='kpirecord')
    op.drop_index(op.f('ix_kpirecord_date'), table_name='kpirecord')
    op.drop_table('kpirecord')
    op.drop_index(op.f('ix_user_username'), table_name='user')
    op.drop_table('user')
