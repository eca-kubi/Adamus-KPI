"""split Exploration Drilling into RC and DD metrics

The Geology "Exploration Drilling" KPI is now tracked as two separate metrics,
"Exploration Drilling (RC)" and "Exploration Drilling (DD)". Existing KPI
records (daily inputs + monthly fixed inputs) and user ``allowed_metrics``
entries still reference the old single metric name, so they are migrated here:

* Records whose ``data.drill_type`` is ``"DD"`` become "Exploration Drilling (DD)".
* Every other record (``"RC"``, ``"RC, DD"`` or a missing/blank drill type)
  becomes "Exploration Drilling (RC)".
* The obsolete ``drill_type`` key is removed from the record data.

Revision ID: r6m7n8o9p0q1
Revises: q5l6m7n8o9p0
Create Date: 2026-10-15 00:00:00.000000

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'r6m7n8o9p0q1'
down_revision: Union[str, Sequence[str], None] = 'q5l6m7n8o9p0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


OLD_NAME = 'Exploration Drilling'
RC_NAME = 'Exploration Drilling (RC)'
DD_NAME = 'Exploration Drilling (DD)'


def _loads(value):
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return None


def _split_kpirecord_metrics() -> None:
    """Move 'Exploration Drilling' records onto the RC/DD metrics."""
    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            "SELECT id, data FROM kpirecord WHERE metric_name = :old_name"
        ),
        {"old_name": OLD_NAME},
    ).mappings().all()

    for row in rows:
        data = _loads(row['data']) or {}
        drill_type = str(data.get('drill_type') or '').strip().upper()
        new_name = DD_NAME if drill_type == 'DD' else RC_NAME

        # The drill_type key is no longer meaningful once the metric itself
        # identifies the drilling method.
        data.pop('drill_type', None)

        bind.execute(
            sa.text(
                "UPDATE kpirecord SET metric_name = :new_name, data = :data "
                "WHERE id = :id"
            ),
            {"new_name": new_name, "data": json.dumps(data), "id": row['id']},
        )


def _revert_kpirecord_metrics() -> None:
    """Move the RC/DD records back onto the single 'Exploration Drilling' metric."""
    bind = op.get_bind()
    bind.execute(
        sa.text(
            "UPDATE kpirecord SET metric_name = :old_name "
            "WHERE metric_name IN (:rc_name, :dd_name)"
        ),
        {"old_name": OLD_NAME, "rc_name": RC_NAME, "dd_name": DD_NAME},
    )


def _replace_allowed_metrics(old_name: str, new_names: Sequence[str]) -> None:
    """Replace a metric name in every user's allowed_metrics JSON array."""
    bind = op.get_bind()
    users = bind.execute(
        sa.text("SELECT id, allowed_metrics FROM user")
    ).mappings().all()

    for user in users:
        metrics = _loads(user['allowed_metrics'])
        if not isinstance(metrics, list):
            continue

        updated = []
        for m in metrics:
            if m == old_name:
                for n in new_names:
                    if n not in updated:
                        updated.append(n)
            elif m not in updated:
                updated.append(m)

        if updated != metrics:
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :uid"),
                {"metrics": json.dumps(updated), "uid": user['id']},
            )


def upgrade() -> None:
    """Split the Exploration Drilling metric into RC and DD."""
    _split_kpirecord_metrics()
    _replace_allowed_metrics(OLD_NAME, [RC_NAME, DD_NAME])


def downgrade() -> None:
    """Merge the RC and DD metrics back into a single Exploration Drilling metric."""
    _revert_kpirecord_metrics()
    # Collapse the two metric names back into the single legacy name.
    bind = op.get_bind()
    users = bind.execute(
        sa.text("SELECT id, allowed_metrics FROM user")
    ).mappings().all()

    for user in users:
        metrics = _loads(user['allowed_metrics'])
        if not isinstance(metrics, list):
            continue

        updated = []
        for m in metrics:
            if m in (RC_NAME, DD_NAME):
                if OLD_NAME not in updated:
                    updated.append(OLD_NAME)
            elif m not in updated:
                updated.append(m)

        if updated != metrics:
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :uid"),
                {"metrics": json.dumps(updated), "uid": user['id']},
            )
