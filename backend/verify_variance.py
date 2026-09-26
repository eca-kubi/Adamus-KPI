import sys
import os
from datetime import date
from sqlmodel import Session, SQLModel, create_engine
from backend.models import KPIRecord
from backend.main import cascade_fixed_input, recalculate_metric_month, CascadeFixedRequest

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
        print(f"Bad -> Budget Variance var3 Expected '-100%': {r_ohs_bad.data.get('var3')}")
        
        assert r_ohs_good.data.get('var1') == "0%"
        assert r_ohs_bad.data.get('var1') == "-100%"
        assert r_ohs_good.data.get('mtd_forecast') == 0.5
        assert r_ohs_good.data.get('outlook') == 0.5
        assert r_ohs_good.data.get('var3') == "0%"
        assert r_ohs_bad.data.get('mtd_forecast') == 0.5
        assert r_ohs_bad.data.get('outlook') == 1.25
        assert r_ohs_bad.data.get('var3') == "-100%"
        
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

        # Setup Data for Rehandle Grade
        metric_rehandle = "Rehandle Grade"
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
        
        # We need to trigger recalculation for Rehandle Grade
        from backend.main import recalculate_metric_month
        recalculate_metric_month(dept_std, metric_rehandle, 2026, 1, session)
        session.commit()
        
        session.refresh(r_rehandle_1)
        session.refresh(r_rehandle_2)
        
        print("\n--- Verifying Rehandle Grade (Weighted average, forecast mirrors daily) ---")
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

        # Setup Data for Rehandle (tonnes only)
        metric_tonnes_rehandle = "Rehandle"
        r_tonnes_rehandle_1 = KPIRecord(
            department=dept_std,
            metric_name=metric_tonnes_rehandle,
            date=date(2026, 1, 1),
            subtype="daily_input",
            data={"daily_actual": 1000, "daily_forecast": 1200}
        )
        r_tonnes_rehandle_2 = KPIRecord(
            department=dept_std,
            metric_name=metric_tonnes_rehandle,
            date=date(2026, 1, 2),
            subtype="daily_input",
            data={"daily_actual": 2000, "daily_forecast": 1500}
        )
        session.add(r_tonnes_rehandle_1)
        session.add(r_tonnes_rehandle_2)
        session.commit()

        recalculate_metric_month(dept_std, metric_tonnes_rehandle, 2026, 1, session)
        session.commit()

        session.refresh(r_tonnes_rehandle_1)
        session.refresh(r_tonnes_rehandle_2)

        print("\n--- Verifying Rehandle (Tonnes only, cumulative forecast/actual) ---")
        print(f"Day 1 Var1 (Expected -17%): {r_tonnes_rehandle_1.data.get('var1')}")
        print(f"Day 1 MTD Actual (Expected 1000): {r_tonnes_rehandle_1.data.get('mtd_actual')}")
        print(f"Day 1 MTD Forecast (Expected 1200): {r_tonnes_rehandle_1.data.get('mtd_forecast')}")
        print(f"Day 1 Var2 (Expected -17%): {r_tonnes_rehandle_1.data.get('var2')}")
        print(f"Day 1 Outlook (Expected '-'): {r_tonnes_rehandle_1.data.get('outlook')}")

        print(f"Day 2 Var1 (Expected 33%): {r_tonnes_rehandle_2.data.get('var1')}")
        print(f"Day 2 MTD Actual (Expected 3000): {r_tonnes_rehandle_2.data.get('mtd_actual')}")
        print(f"Day 2 MTD Forecast (Expected 2700): {r_tonnes_rehandle_2.data.get('mtd_forecast')}")
        print(f"Day 2 Var2 (Expected 11%): {r_tonnes_rehandle_2.data.get('var2')}")

        assert r_tonnes_rehandle_1.data.get('var1') == "-17%"
        assert r_tonnes_rehandle_1.data.get('mtd_actual') == 1000
        assert r_tonnes_rehandle_1.data.get('mtd_forecast') == 1200
        assert r_tonnes_rehandle_1.data.get('var2') == "-17%"
        assert r_tonnes_rehandle_1.data.get('outlook') == "-"

        assert r_tonnes_rehandle_2.data.get('var1') == "33%"
        assert r_tonnes_rehandle_2.data.get('mtd_actual') == 3000
        assert r_tonnes_rehandle_2.data.get('mtd_forecast') == 2700
        assert r_tonnes_rehandle_2.data.get('var2') == "11%"

        # Setup Data for Engineering (MTD Actual = plain average of daily_actual,
        # MTD Forecast = that day's single daily forecast)
        dept_eng = "Engineering"
        metric_eng = "Ancillary Excavators"
        r_eng_1 = KPIRecord(
            department=dept_eng,
            metric_name=metric_eng,
            date=date(2026, 1, 1),
            subtype="daily_input",
            data={"qty_available": 5, "daily_actual": "90%", "daily_forecast": "88%"}
        )
        r_eng_2 = KPIRecord(
            department=dept_eng,
            metric_name=metric_eng,
            date=date(2026, 1, 2),
            subtype="daily_input",
            data={"qty_available": 4, "daily_actual": "80%", "daily_forecast": "90%"}
        )
        r_eng_3 = KPIRecord(
            department=dept_eng,
            metric_name=metric_eng,
            date=date(2026, 1, 3),
            subtype="daily_input",
            data={"qty_available": 4, "daily_actual": "70%", "daily_forecast": "86%"}
        )
        # Day 4 has no actual — it must be skipped, not counted as 0.
        r_eng_4 = KPIRecord(
            department=dept_eng,
            metric_name=metric_eng,
            date=date(2026, 1, 4),
            subtype="daily_input",
            data={"qty_available": 4, "daily_actual": "", "daily_forecast": "88%"}
        )
        session.add(r_eng_1)
        session.add(r_eng_2)
        session.add(r_eng_3)
        session.add(r_eng_4)
        session.commit()

        recalculate_metric_month(dept_eng, metric_eng, 2026, 1, session)
        session.commit()

        session.refresh(r_eng_1)
        session.refresh(r_eng_2)
        session.refresh(r_eng_3)
        session.refresh(r_eng_4)

        print("\n--- Verifying Engineering (MTD Actual = plain average, MTD Forecast = daily forecast) ---")
        print(f"Day 1 MTD Actual (Expected 90) / MTD Forecast (Expected 88): {r_eng_1.data.get('mtd_actual')} / {r_eng_1.data.get('mtd_forecast')}")
        print(f"Day 2 MTD Actual (Expected 85) / MTD Forecast (Expected 90): {r_eng_2.data.get('mtd_actual')} / {r_eng_2.data.get('mtd_forecast')}")
        print(f"Day 3 MTD Actual (Expected 80) / MTD Forecast (Expected 86): {r_eng_3.data.get('mtd_actual')} / {r_eng_3.data.get('mtd_forecast')}")
        print(f"Day 4 MTD Actual (Expected 80) / MTD Forecast (Expected 88): {r_eng_4.data.get('mtd_actual')} / {r_eng_4.data.get('mtd_forecast')}")

        # (90 + 80) / 2 and (90 + 80 + 70) / 3 — NOT the old
        # sum(actual * forecast) / sum(actual) weighting (which gave 87.95 / 86.7).
        assert r_eng_1.data.get('mtd_actual') == 90, f"Expected 90 but got {r_eng_1.data.get('mtd_actual')}"
        assert r_eng_2.data.get('mtd_actual') == 85, f"Expected 85 but got {r_eng_2.data.get('mtd_actual')}"
        assert r_eng_3.data.get('mtd_actual') == 80, f"Expected 80 but got {r_eng_3.data.get('mtd_actual')}"
        assert r_eng_4.data.get('mtd_actual') == 80, f"Expected 80 but got {r_eng_4.data.get('mtd_actual')}"

        # MTD Forecast mirrors that day's own forecast — it must never accumulate
        # (a running sum would give 88 / 178 / 264 / 352 here).
        assert r_eng_1.data.get('mtd_forecast') == 88, f"Expected 88 but got {r_eng_1.data.get('mtd_forecast')}"
        assert r_eng_2.data.get('mtd_forecast') == 90, f"Expected 90 but got {r_eng_2.data.get('mtd_forecast')}"
        assert r_eng_3.data.get('mtd_forecast') == 86, f"Expected 86 but got {r_eng_3.data.get('mtd_forecast')}"
        assert r_eng_4.data.get('mtd_forecast') == 88, f"Expected 88 but got {r_eng_4.data.get('mtd_forecast')}"

        # Setup Data for Stockpile (Near Pit Ore Stockpile)
        metric_stockpile = "Near Pit Ore Stockpile"
        r_stockpile_1 = KPIRecord(
            department=dept_std,
            metric_name=metric_stockpile,
            date=date(2026, 1, 1),
            subtype="daily_input",
            data={"daily_actual": 4500.5, "daily_forecast": 0.0}
        )
        r_stockpile_2 = KPIRecord(
            department=dept_std,
            metric_name=metric_stockpile,
            date=date(2026, 1, 2),
            subtype="daily_input",
            data={"daily_actual": 5100.0, "daily_forecast": 100.0} # daily forecast should get forced to 0
        )
        r_stockpile_3 = KPIRecord(
            department=dept_std,
            metric_name=metric_stockpile,
            date=date(2026, 1, 3),
            subtype="daily_input",
            data={"daily_actual": 0.0, "daily_forecast": 0.0}
        )
        session.add(r_stockpile_1)
        session.add(r_stockpile_2)
        session.add(r_stockpile_3)
        session.commit()

        recalculate_metric_month(dept_std, metric_stockpile, 2026, 1, session)
        session.commit()

        session.refresh(r_stockpile_1)
        session.refresh(r_stockpile_2)
        session.refresh(r_stockpile_3)

        print("\n--- Verifying Near Pit Ore Stockpile (Forecast forced 0, MTD Actual = Daily Actual, Outlook = Daily Actual) ---")
        print(f"Day 1 Var1 (Expected '-'): {r_stockpile_1.data.get('var1')}")
        print(f"Day 1 MTD Actual (Expected 4500.5): {r_stockpile_1.data.get('mtd_actual')}")
        print(f"Day 1 MTD Forecast (Expected 0): {r_stockpile_1.data.get('mtd_forecast')}")
        print(f"Day 1 Var2 (Expected '-'): {r_stockpile_1.data.get('var2')}")
        print(f"Day 1 Outlook (Expected 4500.5): {r_stockpile_1.data.get('outlook')}")

        print(f"Day 2 Var1 (Expected '-'): {r_stockpile_2.data.get('var1')}")
        print(f"Day 2 MTD Actual (Expected 5100.0): {r_stockpile_2.data.get('mtd_actual')}")
        print(f"Day 2 MTD Forecast (Expected 0): {r_stockpile_2.data.get('mtd_forecast')}")
        print(f"Day 2 Var2 (Expected '-'): {r_stockpile_2.data.get('var2')}")
        print(f"Day 2 Outlook (Expected 5100.0): {r_stockpile_2.data.get('outlook')}")
        
        print(f"Day 3 Var1 (Expected '0%'): {r_stockpile_3.data.get('var1')}")

        assert r_stockpile_1.data.get('var1') == "-"
        assert r_stockpile_1.data.get('mtd_actual') == 4500.5
        assert r_stockpile_1.data.get('mtd_forecast') == 0.0
        assert r_stockpile_1.data.get('var2') == "-"
        assert r_stockpile_1.data.get('outlook') == 4500.5

        assert r_stockpile_2.data.get('var1') == "-"
        assert r_stockpile_2.data.get('mtd_actual') == 5100.0
        assert r_stockpile_2.data.get('mtd_forecast') == 0.0
        assert r_stockpile_2.data.get('var2') == "-"
        assert r_stockpile_2.data.get('outlook') == 5100.0

        assert r_stockpile_3.data.get('var1') == "0%"

        # Setup Data for Grade Stockpile (Near Pit Ore Stockpile Grade)
        metric_grade_stockpile = "Near Pit Ore Stockpile Grade"
        r_gstockpile_1 = KPIRecord(
            department=dept_std,
            metric_name=metric_grade_stockpile,
            date=date(2026, 1, 1),
            subtype="daily_input",
            data={"daily_actual": 4500.5, "daily_act_grade": 1.5, "daily_forecast": 0.0}
        )
        r_gstockpile_2 = KPIRecord(
            department=dept_std,
            metric_name=metric_grade_stockpile,
            date=date(2026, 1, 2),
            subtype="daily_input",
            data={"daily_actual": 5100.0, "daily_act_grade": 0.0, "daily_forecast": 1.0} # daily forecast should get forced to 0
        )
        session.add(r_gstockpile_1)
        session.add(r_gstockpile_2)
        session.commit()

        recalculate_metric_month(dept_std, metric_grade_stockpile, 2026, 1, session)
        session.commit()

        session.refresh(r_gstockpile_1)
        session.refresh(r_gstockpile_2)

        print("\n--- Verifying Near Pit Ore Stockpile Grade (Forecast forced 0, MTD Actual = Daily Actual Grade, Outlook = Daily Actual Grade) ---")
        print(f"Day 1 Var1 (Expected '-'): {r_gstockpile_1.data.get('var1')}")
        print(f"Day 1 MTD Actual (Expected 1.5): {r_gstockpile_1.data.get('mtd_actual')}")
        print(f"Day 1 MTD Forecast (Expected 0): {r_gstockpile_1.data.get('mtd_forecast')}")
        print(f"Day 1 Var2 (Expected '-'): {r_gstockpile_1.data.get('var2')}")
        print(f"Day 1 Outlook (Expected 1.5): {r_gstockpile_1.data.get('outlook')}")

        print(f"Day 2 Var1 (Expected '0%'): {r_gstockpile_2.data.get('var1')}")
        print(f"Day 2 MTD Actual (Expected 0.0): {r_gstockpile_2.data.get('mtd_actual')}")
        print(f"Day 2 MTD Forecast (Expected 0): {r_gstockpile_2.data.get('mtd_forecast')}")
        print(f"Day 2 Var2 (Expected '0%'): {r_gstockpile_2.data.get('var2')}")
        print(f"Day 2 Outlook (Expected 0.0): {r_gstockpile_2.data.get('outlook')}")

        assert r_gstockpile_1.data.get('var1') == "-"
        assert r_gstockpile_1.data.get('mtd_actual') == 1.5
        assert r_gstockpile_1.data.get('mtd_forecast') == 0.0
        assert r_gstockpile_1.data.get('var2') == "-"
        assert r_gstockpile_1.data.get('outlook') == 1.5

        assert r_gstockpile_2.data.get('var1') == "0%"
        assert r_gstockpile_2.data.get('mtd_actual') == 0.0
        assert r_gstockpile_2.data.get('mtd_forecast') == 0.0
        assert r_gstockpile_2.data.get('var2') == "0%"
        assert r_gstockpile_2.data.get('outlook') == 0.0

        # Setup Data for Pct Metric (Availability - Dump Trucks) under Mining
        metric_avail = "Availability - Dump Trucks"
        r_avail_1 = KPIRecord(
            department=dept_std,
            metric_name=metric_avail,
            date=date(2026, 1, 1),
            subtype="daily_input",
            data={"daily_actual": 85, "daily_forecast": 80}
        )
        r_avail_2 = KPIRecord(
            department=dept_std,
            metric_name=metric_avail,
            date=date(2026, 1, 2),
            subtype="daily_input",
            data={"daily_actual": 75, "daily_forecast": 80}
        )
        session.add(r_avail_1)
        session.add(r_avail_2)
        session.commit()

        recalculate_metric_month(dept_std, metric_avail, 2026, 1, session)
        session.commit()

        session.refresh(r_avail_1)
        session.refresh(r_avail_2)

        print("\n--- Verifying Availability - Dump Trucks (Var1 = Actual - Forecast, MTD/Outlook forced to '-') ---")
        print(f"Day 1 Var1 (Expected '5%'): {r_avail_1.data.get('var1')}")
        print(f"Day 1 MTD Actual (Expected '-'): {r_avail_1.data.get('mtd_actual')}")
        print(f"Day 1 Outlook (Expected '-'): {r_avail_1.data.get('outlook')}")
        print(f"Day 2 Var1 (Expected '-5%'): {r_avail_2.data.get('var1')}")

        assert r_avail_1.data.get('var1') == "5%"
        assert r_avail_1.data.get('mtd_actual') == "-"
        assert r_avail_1.data.get('outlook') == "-"
        assert r_avail_2.data.get('var1') == "-5%"

        # Setup Data for Milling_CIL (day2 auto-population and var1 formula)
        dept_mill = "Milling_CIL"
        metric_mill = "Gold Contained"

        # Day 1: no day2/day2_forecast provided — should not compute var1 (idx==0, no prev)
        r_mill_1 = KPIRecord(
            department=dept_mill,
            metric_name=metric_mill,
            date=date(2026, 1, 1),
            subtype="daily_input",
            data={"daily_actual": 100, "daily_forecast": 90}
        )
        # Day 2: day2 is absent — should be auto-populated from Day 1's daily_actual (100) / daily_forecast (90)
        r_mill_2 = KPIRecord(
            department=dept_mill,
            metric_name=metric_mill,
            date=date(2026, 1, 2),
            subtype="daily_input",
            data={"daily_actual": 110, "daily_forecast": 95}
        )
        # Day 3: any day2/day2_forecast supplied here is ignored — Milling/CIL day2
        # is always the previous day's daily_actual/daily_forecast (Day 2: 110 / 95).
        r_mill_3 = KPIRecord(
            department=dept_mill,
            metric_name=metric_mill,
            date=date(2026, 1, 3),
            subtype="daily_input",
            data={"daily_actual": 120, "daily_forecast": 100, "day2": 50, "day2_forecast": 100}
        )

        session.add(r_mill_1)
        session.add(r_mill_2)
        session.add(r_mill_3)
        session.commit()

        recalculate_metric_month(dept_mill, metric_mill, 2026, 1, session)
        session.commit()

        session.refresh(r_mill_1)
        session.refresh(r_mill_2)
        session.refresh(r_mill_3)

        print("\n--- Verifying Milling_CIL (day2 auto-population and var1/day2_var formulas) ---")

        # Day 1: var1 is the plain daily variance; idx=0 has no previous record so
        # day2/day2_forecast are absent and day2_var must be "-".
        print(f"Day 1 var1 (Expected '11%'): {r_mill_1.data.get('var1')}")
        print(f"Day 1 day2_var (Expected '-'): {r_mill_1.data.get('day2_var')}")
        assert r_mill_1.data.get('var1') == "11%", f"Expected '11%' but got {r_mill_1.data.get('var1')}"
        assert r_mill_1.data.get('day2_var') == "-", f"Expected '-' but got {r_mill_1.data.get('day2_var')}"

        # Day 2: day2 auto-populated from Day 1 daily_actual=100, day2_forecast from Day 1 daily_forecast=90
        # day2_var = (100 - 90) / 90 * 100 = 11.11... → 11%
        # var1 = (110 - 95) / 95 * 100 = 15.78... → 16%
        print(f"Day 2 day2 (Expected 100): {r_mill_2.data.get('day2')}")
        print(f"Day 2 day2_forecast (Expected 90): {r_mill_2.data.get('day2_forecast')}")
        print(f"Day 2 var1 (Expected '16%'): {r_mill_2.data.get('var1')}")
        print(f"Day 2 day2_var (Expected '11%'): {r_mill_2.data.get('day2_var')}")
        assert float(r_mill_2.data.get('day2')) == 100.0, f"Expected day2=100 but got {r_mill_2.data.get('day2')}"
        assert float(r_mill_2.data.get('day2_forecast')) == 90.0, f"Expected day2_forecast=90 but got {r_mill_2.data.get('day2_forecast')}"
        assert r_mill_2.data.get('var1') == "16%", f"Expected '16%' but got {r_mill_2.data.get('var1')}"
        assert r_mill_2.data.get('day2_var') == "11%", f"Expected '11%' but got {r_mill_2.data.get('day2_var')}"

        # Day 3: day2/day2_forecast come from Day 2 (110 / 95), not the supplied 50 / 100.
        # day2_var = (110 - 95) / 95 * 100 = 15.78... → 16%
        # var1 = (120 - 100) / 100 * 100 = 20%
        print(f"Day 3 day2 (Expected 110): {r_mill_3.data.get('day2')}")
        print(f"Day 3 day2_forecast (Expected 95): {r_mill_3.data.get('day2_forecast')}")
        print(f"Day 3 var1 (Expected '20%'): {r_mill_3.data.get('var1')}")
        print(f"Day 3 day2_var (Expected '16%'): {r_mill_3.data.get('day2_var')}")
        assert float(r_mill_3.data.get('day2')) == 110.0, f"Expected day2=110 but got {r_mill_3.data.get('day2')}"
        assert float(r_mill_3.data.get('day2_forecast')) == 95.0, f"Expected day2_forecast=95 but got {r_mill_3.data.get('day2_forecast')}"
        assert r_mill_3.data.get('var1') == "20%", f"Expected '20%' but got {r_mill_3.data.get('var1')}"
        assert r_mill_3.data.get('day2_var') == "16%", f"Expected '16%' but got {r_mill_3.data.get('day2_var')}"

        print("\nSUCCESS: All variance logic verified!")


def verify_toll_grade_weighted_mtd():
    """Toll Grade MTD Actual/Forecast must be tonne-weighted averages by Toll Tonnes."""
    # Use a dedicated in-memory DB so this check is independent of the other
    # (currently stale) sections in this script.
    toll_engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(toll_engine)

    with Session(toll_engine) as session:
        dept = "Milling_CIL"
        grade_records = [
            KPIRecord(
                department=dept,
                metric_name="Toll Grade",
                date=date(2026, 1, 1),
                subtype="daily_input",
                data={"daily_actual": 1.50, "daily_forecast": 1.60},
            ),
            KPIRecord(
                department=dept,
                metric_name="Toll Grade",
                date=date(2026, 1, 2),
                subtype="daily_input",
                data={"daily_actual": 1.80, "daily_forecast": 1.70},
            ),
        ]
        # Toll Tonnes is the weight for the grade; actual and forecast weight separately.
        tonnes_records = [
            KPIRecord(
                department=dept,
                metric_name="Toll Tonnes",
                date=date(2026, 1, 1),
                subtype="daily_input",
                data={"daily_actual": 1000, "daily_forecast": 1200},
            ),
            KPIRecord(
                department=dept,
                metric_name="Toll Tonnes",
                date=date(2026, 1, 2),
                subtype="daily_input",
                data={"daily_actual": 2000, "daily_forecast": 800},
            ),
        ]
        for rec in grade_records + tonnes_records:
            session.add(rec)
        session.commit()

        recalculate_metric_month(dept, "Toll Grade", 2026, 1, session)
        session.commit()

        for rec in grade_records:
            session.refresh(rec)

        day1, day2 = grade_records

        print("\n--- Verifying Milling_CIL Toll Grade (tonne-weighted average by Toll Tonnes) ---")
        # Day 1: a single record, so the weighted average equals the daily value.
        print(f"Day 1 MTD Actual (Expected 1.5): {day1.data.get('mtd_actual')}")
        print(f"Day 1 MTD Forecast (Expected 1.6): {day1.data.get('mtd_forecast')}")
        # Day 2 actual: (1.50*1000 + 1.80*2000) / (1000 + 2000) = 5100/3000 = 1.70
        print(f"Day 2 MTD Actual (Expected 1.7): {day2.data.get('mtd_actual')}")
        # Day 2 forecast: (1.60*1200 + 1.70*800) / (1200 + 800) = 3280/2000 = 1.64
        print(f"Day 2 MTD Forecast (Expected 1.64): {day2.data.get('mtd_forecast')}")
        # Outlook mirrors the weighted MTD Actual for Toll Grade.
        print(f"Day 2 Outlook (Expected 1.7): {day2.data.get('outlook')}")

        assert day1.data.get("mtd_actual") == 1.5
        assert day1.data.get("mtd_forecast") == 1.6
        assert day2.data.get("mtd_actual") == 1.7
        assert day2.data.get("mtd_forecast") == 1.64
        assert day2.data.get("outlook") == 1.7

        print("\nSUCCESS: Toll Grade weighted-average MTD verified!")


def verify_toll_grade_zero_weight_days():
    """A day with no Toll Tonnes record gets a weight of 0 and drops out of the average."""
    zero_weight_engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(zero_weight_engine)

    with Session(zero_weight_engine) as session:
        dept = "Milling_CIL"
        grade_records = [
            # Day 1 has no Toll Tonnes record -> weight 0 -> excluded.
            KPIRecord(
                department=dept,
                metric_name="Toll Grade",
                date=date(2026, 1, 1),
                subtype="daily_input",
                data={"daily_actual": 1.50, "daily_forecast": 1.60},
            ),
            # Day 2 is the only day that carries a weight.
            KPIRecord(
                department=dept,
                metric_name="Toll Grade",
                date=date(2026, 1, 2),
                subtype="daily_input",
                data={"daily_actual": 1.80, "daily_forecast": 1.70},
            ),
            # Day 3 has no Toll Tonnes record -> weight 0 -> excluded.
            KPIRecord(
                department=dept,
                metric_name="Toll Grade",
                date=date(2026, 1, 3),
                subtype="daily_input",
                data={"daily_actual": 2.00, "daily_forecast": 1.90},
            ),
        ]
        tonnes_records = [
            KPIRecord(
                department=dept,
                metric_name="Toll Tonnes",
                date=date(2026, 1, 2),
                subtype="daily_input",
                data={"daily_actual": 1000, "daily_forecast": 1200},
            ),
        ]
        for rec in grade_records + tonnes_records:
            session.add(rec)
        session.commit()

        recalculate_metric_month(dept, "Toll Grade", 2026, 1, session)
        session.commit()

        for rec in grade_records:
            session.refresh(rec)

        day1, day2, day3 = grade_records

        print("\n--- Verifying Toll Grade zero-weight days (missing Toll Tonnes -> weight 0) ---")
        # Day 1: the only recorded day has weight 0, so there is no weighted data yet.
        print(f"Day 1 MTD Actual (Expected 0): {day1.data.get('mtd_actual')}")
        print(f"Day 1 MTD Forecast (Expected 0): {day1.data.get('mtd_forecast')}")
        # Day 2: only day 2 carries a weight, so the MTD equals day 2's own grade.
        print(f"Day 2 MTD Actual (Expected 1.8): {day2.data.get('mtd_actual')}")
        print(f"Day 2 MTD Forecast (Expected 1.7): {day2.data.get('mtd_forecast')}")
        # Day 3: weight 0, so it is excluded and the MTD is unchanged from day 2.
        print(f"Day 3 MTD Actual (Expected 1.8): {day3.data.get('mtd_actual')}")
        print(f"Day 3 MTD Forecast (Expected 1.7): {day3.data.get('mtd_forecast')}")

        assert day1.data.get("mtd_actual") == 0.0
        assert day1.data.get("mtd_forecast") == 0.0
        assert day2.data.get("mtd_actual") == 1.8
        assert day2.data.get("mtd_forecast") == 1.7
        assert day3.data.get("mtd_actual") == 1.8
        assert day3.data.get("mtd_forecast") == 1.7

        print("\nSUCCESS: Toll Grade zero-weight-day handling verified!")


if __name__ == "__main__":
    verify_toll_grade_weighted_mtd()
    verify_toll_grade_zero_weight_days()
    verify_variance_logic()
