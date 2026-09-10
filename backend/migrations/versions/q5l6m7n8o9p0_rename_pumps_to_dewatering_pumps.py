"""rename Pumps to Dewatering Pumps

The Engineering KPI was renamed from "Pumps" to "Dewatering Pumps" in the
application's metric mappings, but existing KPI records (including the monthly
fixed_input rows that drive the Daily Forecast auto-population) and user
allowed_metrics entries were never migrated. As a result the "Dewatering Pumps"
form could not find its fixed input and the Daily Forecast stayed blank.

Revision ID: q5l6m7n8o9p0
Revises: p4k5l6m7n8o9
Create Date: 2026-09-10 00:00:00.000000

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'q5l6m7n8o9p0'
down_revision: Union[str, Sequence[str], None] = 'p4k5l6m7n8o9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


OLD_NAME = 'Pumps'
NEW_NAME = 'Dewatering Pumps'


def _rename_allowed_metrics(old_name: str, new_name: str) -> None:
    """Rename a metric inside user.allowed_metrics JSON arrays."""
    bind = op.get_bind()
    users = bind.execute(
        sa.text("SELECT id, allowed_metrics FROM user")
    ).mappings().all()

    for user in users:
        metrics_json = user['allowed_metrics']
        metrics = []
        if metrics_json:
            try:
                metrics = json.loads(metrics_json) if isinstance(metrics_json, str) else metrics_json
            except Exception:
                continue

        if not isinstance(metrics, list):
            continue

        updated = [new_name if m == old_name else m for m in metrics]
        if updated != metrics:
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :uid"),
                {"metrics": json.dumps(updated), "uid": user['id']},
            )


def _rename_kpirecord_metrics(old_name: str, new_name: str) -> None:
    """Rename metric_name on all KPI records (daily inputs + fixed inputs)."""
    bind = op.get_bind()
    bind.execute(
        sa.text(
            "UPDATE kpirecord SET metric_name = :new_name "
            "WHERE metric_name = :old_name"
        ),
        {"new_name": new_name, "old_name": old_name},
    )


def upgrade() -> None:
    """Rename Pumps -> Dewatering Pumps in kpirecord and user.allowed_metrics."""

    # 1. Update kpirecord.metric_name (daily inputs + fixed inputs)
    _rename_kpirecord_metrics(OLD_NAME, NEW_NAME)

    # 2. Update user.allowed_metrics JSON arrays
    _rename_allowed_metrics(OLD_NAME, NEW_NAME)


def downgrade() -> None:
    """Revert Dewatering Pumps -> Pumps in kpirecord and user.allowed_metrics."""

    # 1. Revert kpirecord.metric_name
    _rename_kpirecord_metrics(NEW_NAME, OLD_NAME)

    # 2. Revert user.allowed_metrics JSON arrays
    _rename_allowed_metrics(NEW_NAME, OLD_NAME)
