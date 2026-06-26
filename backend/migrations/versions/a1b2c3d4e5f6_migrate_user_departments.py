"""migrate user departments

Revision ID: a1b2c3d4e5f6
Revises: bf90e56d1f33
Create Date: 2026-04-01 03:26:00.000000

"""
from typing import Sequence, Union
import json

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'bf90e56d1f33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEPARTMENT_METRICS = {
    "Milling_CIL": ["Fixed Inputs", "Gold Contained", "Gold Recovery", "Recovery", "Plant Feed Grade", "Tonnes Treated"],
    "Geology": ["Fixed Inputs", "Exploration Drilling", "Grade Control Drilling", "Toll"],
    "Mining": ["Fixed Inputs", "Ore Mined", "Grade - Ore Mined", "Total Material Mined", "Blast Hole Drilling"],
    "Crushing": ["Fixed Inputs", "Grade - Ore Crushed", "Ore Crushed"],
    "OHS": ["Fixed Inputs", "Safety Incidents", "Environmental Incidents", "Property Damage"],
    "Engineering": ["Fixed Inputs", "Light Vehicles", "Tipper Trucks", "Prime Excavators", "Anx Excavators", "Dump Trucks", "ART Dump Trucks", "Wheel Loaders", "Graders", "Dozers", "Crusher", "Mill", "Pumps", "Drill Rigs"]
}

def get_allowed_metrics_for_departments(departments):
    if not departments: return []
    if "All" in departments:
        all_metrics = set()
        for metrics in DEPARTMENT_METRICS.values():
            all_metrics.update(metrics)
        return list(all_metrics)
    allowed = set()
    for dept in departments:
        if dept in DEPARTMENT_METRICS:
            allowed.update(DEPARTMENT_METRICS[dept])
    return list(allowed)

def upgrade() -> None:
    # 1. Add new columns
    # We use json.dumps for the inner JSON column to be safe across different databases
    op.add_column('user', sa.Column('departments', sa.JSON(), nullable=True))
    op.add_column('user', sa.Column('allowed_metrics', sa.JSON(), nullable=True))

    # 2. Data Migration
    bind = op.get_bind()
    
    # Check if 'department' column still exists in DB so we don't crash if it's already dropped
    insp = sa.inspect(bind)
    columns = [col['name'] for col in insp.get_columns('user')]
    
    if 'department' in columns:
        users = bind.execute(sa.text("SELECT id, username, department, role FROM user")).mappings().all()
        for user in users:
            old_dept = user['department']
            old_role = user['role']

            # Transform department
            new_depts = []
            if old_dept:
                if old_dept == "Management":
                    new_depts = ["All"]
                else:
                    new_depts = [old_dept]

            # Normalize Role
            new_role = old_role
            if old_role == "user" or not old_role:
                new_role = "Staff"

            # Calculate metrics
            new_metrics = get_allowed_metrics_for_departments(new_depts)

            bind.execute(
                sa.text("UPDATE user SET departments = :depts, allowed_metrics = :metrics, role = :role WHERE id = :id"),
                {"depts": json.dumps(new_depts), "metrics": json.dumps(new_metrics), "role": new_role, "id": user['id']}
            )
            
        # 3. Drop old column
        op.drop_column('user', 'department')


def downgrade() -> None:
    # Reverse of upgrade
    op.add_column('user', sa.Column('department', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    
    bind = op.get_bind()
    
    # Reverse Data Migration (best effort: extract first department if it exists)
    insp = sa.inspect(bind)
    columns = [col['name'] for col in insp.get_columns('user')]
    if 'departments' in columns:
        users = bind.execute(sa.text("SELECT id, departments FROM user")).mappings().all()
        for user in users:
            depts_json = user['departments']
            old_dept = None
            if depts_json:
                try:
                    depts = json.loads(depts_json) if isinstance(depts_json, str) else depts_json
                    if depts and len(depts) > 0:
                        old_dept = "Management" if "All" in depts else depts[0]
                except Exception:
                    pass
                    
            bind.execute(
                sa.text("UPDATE user SET department = :dept WHERE id = :id"),
                {"dept": old_dept, "id": user['id']}
            )

    op.drop_column('user', 'allowed_metrics')
    op.drop_column('user', 'departments')
