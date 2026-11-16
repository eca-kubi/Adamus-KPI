"""consolidate CAT 777E and Liebherr T236 into Rigid Dump Trucks

The Engineering KPIs "Dump Truck (CAT 777E)" and "Dump Truck (Liebherr T236)"
are replaced by a single consolidated category, "Rigid Dump Trucks", covering
the whole 16-unit rigid fleet.

KPI records and user ``allowed_metrics`` entries still reference the two old
metric names, so they are migrated here:

* Every daily record from both old metrics becomes "Rigid Dump Trucks".
  Where both models recorded the same date, the CAT 777E row is kept (it is the
  larger fleet) and the duplicate Liebherr row is removed so the metric has a
  single figure per day.
* ``data.qty_available`` on the migrated daily rows is set to the consolidated
  fleet size of 16.
* The old per-model monthly ``fixed_input`` rows are deleted: they carry
  separate per-model targets that no longer apply to the consolidated fleet,
  whose daily forecast target is 85% availability. The Fixed Input for the new
  metric is re-entered by an administrator.
* Both old metric names are replaced by "Rigid Dump Trucks" in every user's
  ``allowed_metrics``.

Revision ID: s7n8o9p0q1r2
Revises: r6m7n8o9p0q1
Create Date: 2026-11-16 00:00:00.000000

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 's7n8o9p0q1r2'
down_revision: Union[str, Sequence[str], None] = 'r6m7n8o9p0q1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CAT_NAME = 'Dump Truck (CAT 777E)'
LIEBHERR_NAME = 'Dump Truck (Liebherr T236)'
OLD_NAMES = (CAT_NAME, LIEBHERR_NAME)
NEW_NAME = 'Rigid Dump Trucks'
FLEET_SIZE = 16


def _loads(value):
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return None


def _consolidate_kpirecords() -> None:
    """Move both per-model metrics onto the consolidated fleet metric."""
    bind = op.get_bind()

    # Obsolete per-model monthly targets: the consolidated fleet has its own.
    bind.execute(
        sa.text(
            "DELETE FROM kpirecord "
            "WHERE metric_name IN (:cat_name, :liebherr_name) "
            "AND subtype = 'fixed_input'"
        ),
        {"cat_name": CAT_NAME, "liebherr_name": LIEBHERR_NAME},
    )

    rows = bind.execute(
        sa.text(
            "SELECT id, metric_name, date, data FROM kpirecord "
            "WHERE metric_name IN (:cat_name, :liebherr_name) "
            "ORDER BY date, CASE metric_name WHEN :cat_name THEN 0 ELSE 1 END, id"
        ),
        {"cat_name": CAT_NAME, "liebherr_name": LIEBHERR_NAME},
    ).mappings().all()

    seen_dates = set()
    for row in rows:
        # Keep one figure per day: the CAT 777E row wins because the query
        # orders it first for each date.
        if row['date'] in seen_dates:
            bind.execute(
                sa.text("DELETE FROM kpirecord WHERE id = :id"),
                {"id": row['id']},
            )
            continue
        seen_dates.add(row['date'])

        data = _loads(row['data']) or {}
        data['qty_available'] = FLEET_SIZE

        bind.execute(
            sa.text(
                "UPDATE kpirecord SET metric_name = :new_name, data = :data "
                "WHERE id = :id"
            ),
            {"new_name": NEW_NAME, "data": json.dumps(data), "id": row['id']},
        )


def _replace_allowed_metrics() -> None:
    """Replace both old metric names with the consolidated one."""
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
            if m in OLD_NAMES:
                if NEW_NAME not in updated:
                    updated.append(NEW_NAME)
            elif m not in updated:
                updated.append(m)

        if updated != metrics:
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :uid"),
                {"metrics": json.dumps(updated), "uid": user['id']},
            )


def upgrade() -> None:
    """Consolidate the two rigid dump truck models into one metric."""
    _consolidate_kpirecords()
    _replace_allowed_metrics()


def downgrade() -> None:
    """Move the consolidated records back onto the CAT 777E metric.

    The consolidation is not losslessly reversible: the merged Liebherr daily
    rows and the deleted per-model Fixed Inputs cannot be recreated, so the
    single merged metric is restored under the CAT 777E name.
    """
    bind = op.get_bind()
    bind.execute(
        sa.text(
            "UPDATE kpirecord SET metric_name = :cat_name WHERE metric_name = :new_name"
        ),
        {"cat_name": CAT_NAME, "new_name": NEW_NAME},
    )

    users = bind.execute(
        sa.text("SELECT id, allowed_metrics FROM user")
    ).mappings().all()

    for user in users:
        metrics = _loads(user['allowed_metrics'])
        if not isinstance(metrics, list):
            continue

        updated = []
        for m in metrics:
            if m == NEW_NAME:
                if CAT_NAME not in updated:
                    updated.append(CAT_NAME)
            elif m not in updated:
                updated.append(m)

        if updated != metrics:
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :uid"),
                {"metrics": json.dumps(updated), "uid": user['id']},
            )
