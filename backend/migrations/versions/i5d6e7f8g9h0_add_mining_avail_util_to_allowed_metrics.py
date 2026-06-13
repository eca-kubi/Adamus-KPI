"""add_mining_avail_util_to_allowed_metrics

Revision ID: i5d6e7f8g9h0
Revises: h4c5d6e7f8g9
Create Date: 2026-06-13 15:15:00.000000

"""
from typing import Sequence, Union
import json
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'i5d6e7f8g9h0'
down_revision: Union[str, Sequence[str], None] = 'h4c5d6e7f8g9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_METRICS = [
    "Availability - Dump Truck",
    "Utilization - Dump Truck",
    "Availability - Excavator",
    "Utilization - Excavator"
]

def upgrade() -> None:
    # Update allowed_metrics for all users containing 'Mining' or 'All' in their departments list
    bind = op.get_bind()
    users = bind.execute(sa.text("SELECT id, departments, allowed_metrics FROM user")).mappings().all()
    for user in users:
        depts_json = user['departments']
        metrics_json = user['allowed_metrics']
        
        depts = []
        if depts_json:
            try:
                depts = json.loads(depts_json) if isinstance(depts_json, str) else depts_json
            except Exception:
                pass
                
        metrics = []
        if metrics_json:
            try:
                metrics = json.loads(metrics_json) if isinstance(metrics_json, str) else metrics_json
            except Exception:
                pass
                
        if depts and ("Mining" in depts or "All" in depts):
            updated = False
            for metric in NEW_METRICS:
                if metric not in metrics:
                    metrics.append(metric)
                    updated = True
            if updated:
                bind.execute(
                    sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :id"),
                    {"metrics": json.dumps(metrics), "id": user['id']}
                )

def downgrade() -> None:
    # Remove these metrics from allowed_metrics for all users
    bind = op.get_bind()
    users = bind.execute(sa.text("SELECT id, allowed_metrics FROM user")).mappings().all()
    for user in users:
        metrics_json = user['allowed_metrics']
        metrics = []
        if metrics_json:
            try:
                metrics = json.loads(metrics_json) if isinstance(metrics_json, str) else metrics_json
            except Exception:
                pass
                
        updated = False
        for metric in NEW_METRICS:
            if metric in metrics:
                metrics.remove(metric)
                updated = True
        if updated:
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :id"),
                {"metrics": json.dumps(metrics), "id": user['id']}
            )
