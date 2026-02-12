import sys
import os
from datetime import date
from sqlmodel import Session, SQLModel, create_engine
from backend.models import KPIRecord
from backend.main import cascade_fixed_input, CascadeFixedRequest

# Use in-memory SQLite for testing
engine = create_engine("sqlite:///:memory:")
SQLModel.metadata.create_all(engine)

def verify_variance_logic():
    with Session(engine) as session:
        # 1. Setup Data for OHS (Lower is Better)
        dept_ohs = "OHS"
        metric_ohs = "Safety Incidents"
        
        # Record with 0 forecast (Should stay 0 if actual 0, or -100% if actual > 0)
        r_ohs_good = KPIRecord(
            department=dept_ohs,
            metric_name=metric_ohs,
            date=date(2026, 1, 1),
            subtype="daily_input",
            data={"daily_actual": 0, "daily_forecast": 0, "mtd_actual": 0, "mtd_forecast": 0}
        )
        r_ohs_bad = KPIRecord(
            department=dept_ohs,
            metric_name=metric_ohs,
            date=date(2026, 1, 2),
            subtype="daily_input",
            data={"daily_actual": 2, "daily_forecast": 0, "mtd_actual": 2, "mtd_forecast": 2}
        )
        
        # Setup Data for Standard (Higher is Better) e.g. Mining
        dept_std = "Mining"
        metric_std = "Ore Mined"
        r_std = KPIRecord(
            department=dept_std,
            metric_name=metric_std,
            date=date(2026, 1, 3),
            subtype="daily_input",
            data={"daily_actual": 100, "daily_forecast": 120, "mtd_actual": 100, "mtd_forecast": 120}
        )

        session.add(r_ohs_good)
        session.add(r_ohs_bad)
        session.add(r_std)
        session.commit()
        
        # 2. Run Cascade for OHS
        payload_ohs = CascadeFixedRequest(
            metric_name=metric_ohs,
            target_month="2026-01",
            full_forecast=0,
            full_budget=0
        )
        cascade_fixed_input(dept_ohs, payload_ohs, session)
        
        # 3. Verify OHS Logic
        session.refresh(r_ohs_good)
        session.refresh(r_ohs_bad)
        
        print("\n--- Verifying OHS (Lower is Better) ---")
        print(f"Good (Act 0, Fcst 0) -> Var1 Expected '0%': {r_ohs_good.data.get('var1')}")
        print(f"Bad (Act 2, Fcst 0) -> Var1 Expected '-100%': {r_ohs_bad.data.get('var1')}")
        
        assert r_ohs_good.data.get('var1') == "0%"
        assert r_ohs_bad.data.get('var1') == "-100%"
        
        # 4. Run Cascade for Standard
        payload_std = CascadeFixedRequest(
            metric_name=metric_std,
            target_month="2026-01",
            full_forecast=2000,
            full_budget=2000
        )
        cascade_fixed_input(dept_std, payload_std, session)
        
        # 5. Verify Standard Logic
        session.refresh(r_std) 
        print("\n--- Verifying Standard (Higher is Better) ---")
        # (100 - 120) / 120 = -16.6% -> -17%
        print(f"Standard (Act 100, Fcst 120) -> Var1 Expected '-17%': {r_std.data.get('var1')}")
        assert r_std.data.get('var1') == "-17%"

        print("\nSUCCESS: All variance logic verified!")

if __name__ == "__main__":
    verify_variance_logic()
