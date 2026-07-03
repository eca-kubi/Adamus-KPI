"""Add chatmessage table for Admin-to-User targeted messaging

Revision ID: m1h2i3j4k5l6
Revises: l8g9h0i1j2k3
Create Date: 2026-07-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'm1h2i3j4k5l6'
down_revision: Union[str, Sequence[str], None] = 'l8g9h0i1j2k3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'chatmessage',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('sender_user_id', sa.Integer(), nullable=False),
        sa.Column('recipient_user_id', sa.Integer(), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_broadcast', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('read', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['recipient_user_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['sender_user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_chatmessage_sender_user_id', 'chatmessage', ['sender_user_id'])
    op.create_index('ix_chatmessage_recipient_user_id', 'chatmessage', ['recipient_user_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('chatmessage')
