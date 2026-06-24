"""rename_mining_avail_util_metrics

Revision ID: j6e7f8g9h0i1
Revises: i5d6e7f8g9h0
Create Date: 2026-06-24 04:10:00.000000

"""
from typing import Sequence, Union
import json
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'j6e7f8g9h0i1'
down_revision: Union[str, Sequence[str], None] = 'i5d6e7f8g9h0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

METRIC_RENAMES = {
    "Availability - Dump Truck": "Availability - Dump Trucks",
    "Utilization - Dump Truck": "Utilization - Dump Trucks",
    "Availability - Excavator": "Availability - Excavators",
    "Utilization - Excavator": "Utilization - Excavators",
}


def _replace_metrics(metrics_list):
    """Replace old metric names with their new names in a list."""
    return [METRIC_RENAMES.get(m, m) for m in metrics_list]


def upgrade() -> None:
    bind = op.get_bind()

    # Rename metric names in KPI records
    for old_name, new_name in METRIC_RENAMES.items():
        bind.execute(
            sa.text("UPDATE kpirecord SET metric_name = :new_name WHERE metric_name = :old_name"),
            {"new_name": new_name, "old_name": old_name},
        )

    # Rename metric names in user allowed_metrics JSON lists
    users = bind.execute(sa.text("SELECT id, allowed_metrics FROM user")).mappings().all()
    for user in users:
        metrics_json = user['allowed_metrics']
        metrics = []
        if metrics_json:
            try:
                metrics = json.loads(metrics_json) if isinstance(metrics_json, str) else metrics_json
            except Exception:
                pass

        if not isinstance(metrics, list):
            continue

        updated_metrics = _replace_metrics(metrics)
        if updated_metrics != metrics:
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :id"),
                {"metrics": json.dumps(updated_metrics), "id": user['id']},
            )


def downgrade() -> None:
    bind = op.get_bind()

    # Restore metric names in KPI records
    for old_name, new_name in METRIC_RENAMES.items():
        bind.execute(
            sa.text("UPDATE kpirecord SET metric_name = :old_name WHERE metric_name = :new_name"),
            {"old_name": old_name, "new_name": new_name},
        )

    # Restore metric names in user allowed_metrics JSON lists
    users = bind.execute(sa.text("SELECT id, allowed_metrics FROM user")).mappings().all()
    for user in users:
        metrics_json = user['allowed_metrics']
        metrics = []
        if metrics_json:
            try:
                metrics = json.loads(metrics_json) if isinstance(metrics_json, str) else metrics_json
            except Exception:
                pass

        if not isinstance(metrics, list):
            continue

        # Build reverse map and replace
        reverse_renames = {v: k for k, v in METRIC_RENAMES.items()}
        updated_metrics = [reverse_renames.get(m, m) for m in metrics]
        if updated_metrics != metrics:
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :id"),
                {"metrics": json.dumps(updated_metrics), "id": user['id']},
            )
