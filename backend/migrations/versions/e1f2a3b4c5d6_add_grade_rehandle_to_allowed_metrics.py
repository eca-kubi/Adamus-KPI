"""add_grade_rehandle_to_allowed_metrics

Revision ID: e1f2a3b4c5d6
Revises: babf3e33b690
Create Date: 2026-06-13 14:00:00.000000

"""
from typing import Sequence, Union
import json
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = 'babf3e33b690'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Update allowed_metrics for all users containing 'Mining' or 'All' in their departments list to include 'Grade Rehandle'
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
            if "Grade Rehandle" not in metrics:
                metrics.append("Grade Rehandle")
                bind.execute(
                    sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :id"),
                    {"metrics": json.dumps(metrics), "id": user['id']}
                )

def downgrade() -> None:
    # Remove 'Grade Rehandle' from allowed_metrics for all users
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
                
        if "Grade Rehandle" in metrics:
            metrics.remove("Grade Rehandle")
            bind.execute(
                sa.text("UPDATE user SET allowed_metrics = :metrics WHERE id = :id"),
                {"metrics": json.dumps(metrics), "id": user['id']}
            )
