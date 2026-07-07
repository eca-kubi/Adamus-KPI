"""Rename Gold Recovery to Gold Recovered

Revision ID: p4k5l6m7n8o9
Revises: o3j4k5l6m7n8
Create Date: 2026-07-07 00:00:00.000000

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'p4k5l6m7n8o9'
down_revision: Union[str, Sequence[str], None] = 'o3j4k5l6m7n8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Rename Gold Recovery -> Gold Recovered in kpirecord and user.allowed_metrics."""

    # 1. Update kpirecord.metric_name
    op.execute(
        sa.text(
            "UPDATE kpirecord SET metric_name = 'Gold Recovered' "
            "WHERE metric_name = 'Gold Recovery'"
        )
    )

    # 2. Update user.allowed_metrics JSON array
    bind = op.get_bind()
    users = bind.execute(
        sa.text("SELECT id, allowed_metrics FROM user")
    ).mappings().all()

    for user in users:
        allowed = user['allowed_metrics']
        if allowed and 'Gold Recovery' in allowed:
            new_allowed = ['Gold Recovered' if m == 'Gold Recovery' else m for m in allowed]
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :uid"),
                {"metrics": json.dumps(new_allowed), "uid": user['id']}
            )


def downgrade() -> None:
    """Revert Gold Recovered -> Gold Recovery in kpirecord and user.allowed_metrics."""

    # 1. Revert kpirecord.metric_name
    op.execute(
        sa.text(
            "UPDATE kpirecord SET metric_name = 'Gold Recovery' "
            "WHERE metric_name = 'Gold Recovered'"
        )
    )

    # 2. Revert user.allowed_metrics JSON array
    bind = op.get_bind()
    users = bind.execute(
        sa.text("SELECT id, allowed_metrics FROM user")
    ).mappings().all()

    for user in users:
        allowed = user['allowed_metrics']
        if allowed and 'Gold Recovered' in allowed:
            new_allowed = ['Gold Recovery' if m == 'Gold Recovered' else m for m in allowed]
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :uid"),
                {"metrics": json.dumps(new_allowed), "uid": user['id']}
            )
