import os
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Metric mapping logic (from main.py)
DEPARTMENT_METRICS = {
    "Milling_CIL": ["Fixed Inputs", "Gold Contained", "Gold Recovery", "Recovery", "Plant Feed Grade", "Tonnes Treated"],
    "Geology": ["Fixed Inputs", "Exploration Drilling", "Grade Control Drilling", "Toll"],
    "Mining": ["Fixed Inputs", "Ore Mined", "Grade - Ore Mined", "Total Material Moved", "Blast Hole Drilling"],
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

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Migrating User table...")
        
        # 1. Add departments column if missing
        try:
            conn.execute(text("ALTER TABLE user ADD COLUMN departments JSON"))
            conn.commit()
            print("Added 'departments' column.")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("'departments' column already exists.")
            else:
                print(f"Error adding departments: {e}")

        # 2. Add allowed_metrics column if missing (though it should be there)
        try:
            conn.execute(text("ALTER TABLE user ADD COLUMN allowed_metrics JSON"))
            conn.commit()
        except: pass

        # 3. Migrate data from department to departments and normalize roles
        users = conn.execute(text("SELECT id, username, department, role FROM user")).fetchall()
        for user_id, username, old_dept, old_role in users:
            # Handle "Management" rename or null
            new_depts = []
            if old_dept:
                if old_dept == "Management":
                    new_depts = ["All"]
                else:
                    new_depts = [old_dept]
            
            # Normalize Role: user -> Staff
            new_role = old_role
            if old_role == "user" or not old_role:
                new_role = "Staff"
            
            # Calculate new allowed metrics
            new_metrics = get_allowed_metrics_for_departments(new_depts)
            
            # Update user record
            conn.execute(
                text("UPDATE user SET departments = :depts, allowed_metrics = :metrics, role = :role WHERE id = :id"),
                {"depts": json.dumps(new_depts), "metrics": json.dumps(new_metrics), "role": new_role, "id": user_id}
            )
            print(f"Migrated user {username}: {new_depts}, Role: {new_role}")

        conn.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
