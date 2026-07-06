"""Add department column to chatmessage for department-scoped broadcasts

Revision ID: o3j4k5l6m7n8
Revises: n2i3j4k5l6m7
Create Date: 2026-07-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'o3j4k5l6m7n8'
down_revision: Union[str, Sequence[str], None] = 'n2i3j4k5l6m7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'chatmessage',
        sa.Column('department', sa.String(length=50), nullable=True),
    )
    op.create_index('ix_chatmessage_department', 'chatmessage', ['department'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_chatmessage_department')
    op.drop_column('chatmessage', 'department')
