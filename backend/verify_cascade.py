import os
from datetime import date
from sqlmodel import Session, SQLModel, create_engine
from backend.models import KPIRecord
from backend.main import cascade_fixed_input, CascadeFixedRequest

# Use in-memory SQLite for testing
engine = create_engine("sqlite:///:memory:")
SQLModel.metadata.create_all(engine)

def verify_cascade():
    with Session(engine) as session:
        # 1. Setup Test Data
        dept = "Mining"
        metric = "Ore Mined"
        target_month = "2026-02"
        
        # Create a few records
        r1 = KPIRecord(
            department=dept,
            metric_name=metric,
            date=date(2026, 2, 1),
            subtype="daily_input",
            data={
                "daily_actual": 100,
                "daily_forecast": 120,
                "mtd_actual": 100,
                "mtd_forecast": 120,
                "full_forecast": 500, # Old value
                "full_budget": 400   # Old value
            }
        )
        r2 = KPIRecord(
            department=dept,
            metric_name=metric,
            date=date(2026, 2, 2),
            subtype="daily_input",
            data={
                "daily_actual": 110,
                "daily_forecast": 120,
                "mtd_actual": 210,
                "mtd_forecast": 240,
                "full_forecast": 500, # Old value
                "full_budget": 400   # Old value
            }
        )
        
        session.add(r1)
        session.add(r2)
        session.commit()
        
        # 2. Call Cascade Function (Simulate API Call)
        payload = CascadeFixedRequest(
            metric_name=metric,
            target_month=target_month,
            full_forecast=1000, # New Value
            full_budget=800     # New Value
        )
        
        print("Running cascade update...")
        result = cascade_fixed_input(dept, payload, session)
        print(f"Update Result: {result}")
        
        # 3. Verify Updates
        updated_r1 = session.get(KPIRecord, r1.id)
        updated_r2 = session.get(KPIRecord, r2.id)
        
        print("\n--- Verifying Record 1 ---")
        print(f"Full Forecast (Expected 1000): {updated_r1.data.get('full_forecast')}")
        print(f"Full Budget (Expected 800): {updated_r1.data.get('full_budget')}")
        # Budget Variance: (1000 - 800) / 800 = 0.25 -> 25%
        print(f"Budget Variance var3 (Expected 25%): {updated_r1.data.get('var3')}")
        
        # Daily Variance: (100 - 120) / 120 = -0.166 -> -17%
        print(f"Daily Variance var1 (Expected -17%): {updated_r1.data.get('var1')}")

        print("\n--- Verifying Record 2 ---")
        # MTD Variance: (210 - 240) / 240 = -0.125 -> -12% (approx)
        print(f"MTD Variance var2 (Expected -12%): {updated_r2.data.get('var2')}")

        assert updated_r1.data['full_forecast'] == 1000
        assert updated_r1.data['full_budget'] == 800
        assert updated_r1.data['var3'] == '25%'
        
        # Check standard variances were recalculated (not lost)
        assert updated_r1.data['var1'] == '-17%'
        assert updated_r2.data['var2'] == '-12%' # simplistic check

        print("\nSUCCESS: Verification Passed!")

if __name__ == "__main__":
    verify_cascade()
