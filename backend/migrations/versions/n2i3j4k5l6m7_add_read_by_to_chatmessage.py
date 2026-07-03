"""Add read_by JSON column to chatmessage for per-user broadcast read tracking

Revision ID: n2i3j4k5l6m7
Revises: m1h2i3j4k5l6
Create Date: 2026-07-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'n2i3j4k5l6m7'
down_revision: Union[str, Sequence[str], None] = 'm1h2i3j4k5l6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'chatmessage',
        sa.Column('read_by', sa.JSON(), nullable=True, server_default=sa.text("('[]')")),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('chatmessage', 'read_by')
