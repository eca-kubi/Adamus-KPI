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
        
        from backend.models import User
        mock_user = User(username="admin", role="Admin", allowed_metrics=[metric_ohs, metric_std])

        # 2. Run Cascade for OHS
        payload_ohs = CascadeFixedRequest(
            metric_name=metric_ohs,
            target_month="2026-01",
            full_forecast=0.5,
            full_budget=6.0,
            annual_target=6.0
        )
        cascade_fixed_input(dept_ohs, payload_ohs, session, _user=mock_user)
        
        # 3. Verify OHS Logic
        session.refresh(r_ohs_good)
        session.refresh(r_ohs_bad)
        
        print("\n--- Verifying OHS (Lower is Better) ---")
        print(f"Good (Act 0, Fcst 0) -> Var1 Expected '0%': {r_ohs_good.data.get('var1')}")
        print(f"Bad (Act 2, Fcst 0) -> Var1 Expected '-100%': {r_ohs_bad.data.get('var1')}")
        print(f"Good -> MTD Forecast Expected '0.5': {r_ohs_good.data.get('mtd_forecast')}")
        print(f"Good -> Outlook Expected '0.5': {r_ohs_good.data.get('outlook')}")
        print(f"Good -> Budget Variance var3 Expected '0%': {r_ohs_good.data.get('var3')}")
        print(f"Bad -> MTD Forecast Expected '0.5': {r_ohs_bad.data.get('mtd_forecast')}")
        print(f"Bad -> Outlook Expected '1.25': {r_ohs_bad.data.get('outlook')}")
        print(f"Bad -> Budget Variance var3 Expected '-50%': {r_ohs_bad.data.get('var3')}")
        
        assert r_ohs_good.data.get('var1') == "0%"
        assert r_ohs_bad.data.get('var1') == "-100%"
        assert r_ohs_good.data.get('mtd_forecast') == 0.5
        assert r_ohs_good.data.get('outlook') == 0.5
        assert r_ohs_good.data.get('var3') == "0%"
        assert r_ohs_bad.data.get('mtd_forecast') == 0.5
        assert r_ohs_bad.data.get('outlook') == 1.25
        assert r_ohs_bad.data.get('var3') == "-50%"
        
        # 4. Run Cascade for Standard
        payload_std = CascadeFixedRequest(
            metric_name=metric_std,
            target_month="2026-01",
            full_forecast=2000,
            full_budget=2000
        )
        cascade_fixed_input(dept_std, payload_std, session, _user=mock_user)
        
        # 5. Verify Standard Logic
        session.refresh(r_std) 
        print("\n--- Verifying Standard (Higher is Better) ---")
        # (100 - 120) / 120 = -16.6% -> -17%
        print(f"Standard (Act 100, Fcst 120) -> Var1 Expected '-17%': {r_std.data.get('var1')}")
        assert r_std.data.get('var1') == "-17%"

        # Setup Data for Grade Rehandle
        metric_rehandle = "Grade Rehandle"
        r_rehandle_1 = KPIRecord(
            department=dept_std,
            metric_name=metric_rehandle,
            date=date(2026, 1, 1),
            subtype="daily_input",
            data={"daily_actual": 1000, "daily_act_grade": 1.50, "daily_forecast": 1.60}
        )
        r_rehandle_2 = KPIRecord(
            department=dept_std,
            metric_name=metric_rehandle,
            date=date(2026, 1, 2),
            subtype="daily_input",
            data={"daily_actual": 2000, "daily_act_grade": 1.80, "daily_forecast": 1.60}
        )
        session.add(r_rehandle_1)
        session.add(r_rehandle_2)
        session.commit()
        
        # We need to trigger recalculation for Grade Rehandle
        from backend.main import recalculate_metric_month
        recalculate_metric_month(dept_std, metric_rehandle, 2026, 1, session)
        session.commit()
        
        session.refresh(r_rehandle_1)
        session.refresh(r_rehandle_2)
        
        print("\n--- Verifying Grade Rehandle (Weighted average, forecast mirrors daily) ---")
        print(f"Day 1 Var1 (Expected -6%): {r_rehandle_1.data.get('var1')}")
        print(f"Day 1 MTD Actual (Expected 1.5): {r_rehandle_1.data.get('mtd_actual')}")
        print(f"Day 1 MTD Forecast (Expected 1.6): {r_rehandle_1.data.get('mtd_forecast')}")
        print(f"Day 1 Var2 (Expected -6%): {r_rehandle_1.data.get('var2')}")
        print(f"Day 1 Outlook (Expected '-'): {r_rehandle_1.data.get('outlook')}")
        
        print(f"Day 2 Var1 (Expected 12%): {r_rehandle_2.data.get('var1')}")
        print(f"Day 2 MTD Actual (Expected 1.7): {r_rehandle_2.data.get('mtd_actual')}")
        print(f"Day 2 MTD Forecast (Expected 1.6): {r_rehandle_2.data.get('mtd_forecast')}")
        print(f"Day 2 Var2 (Expected 6%): {r_rehandle_2.data.get('var2')}")
        
        assert r_rehandle_1.data.get('var1') == "-6%"
        assert r_rehandle_1.data.get('mtd_actual') == 1.5
        assert r_rehandle_1.data.get('mtd_forecast') == 1.6
        assert r_rehandle_1.data.get('var2') == "-6%"
        assert r_rehandle_1.data.get('outlook') == "-"
        
        # 12.5% rounds to 12% in python (round-to-even)
        assert r_rehandle_2.data.get('var1') == "12%"
        assert r_rehandle_2.data.get('mtd_actual') == 1.7
        assert r_rehandle_2.data.get('mtd_forecast') == 1.6
        # 6.25% rounds to 6% in python
        assert r_rehandle_2.data.get('var2') == "6%"

        print("\nSUCCESS: All variance logic verified!")

if __name__ == "__main__":
    verify_variance_logic()
