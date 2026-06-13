import os
import random
from datetime import date, timedelta
from dotenv import load_dotenv
from sqlmodel import Session, select

# Adjust path context
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from models import KPIRecord

load_dotenv()

DEPARTMENTS = {
    "OHS": [
        "Safety Incidents", "Environmental Incidents", "Property Damage", "Near Miss"
    ],
    "Milling_CIL": [
        "Gold Contained", "Gold Recovery", "Recovery", "Plant Feed Grade", "Tonnes Treated"
    ],
    "Crushing": [
        "Ore Crushed", "Grade - Ore Crushed"
    ],
    "Mining": [
        "Ore Mined", "Grade - Ore Mined", "Grade Rehandle", "Rehandle", "Stock Pile Near Pit", "Stock Pile Main Rompad", "Grade Stockpile Near Pit", "Grade Stockpile Main Rompad", "Availability - Dump Truck", "Utilization - Dump Truck", "Availability - Excavator", "Utilization - Excavator", "Total Material Moved", "Blast Hole Drilling"
    ],
    "Geology": [
        "Grade Control Drilling", "Toll", "Exploration Drilling"
    ],
    "Engineering": [
        "Tipper Trucks", "Prime Excavators", "Anx Excavators", "Dump Trucks", 
        "ART Dump Trucks", "Wheel Loaders", "Graders", "Dozers", "Crusher", "Mill", "Light Vehicles",
        "Pumps", "Drill Rigs"
    ]
}

def generate_random_val(metric):
    """Generate a realistic random actual / forecast for a given metric type."""
    m = metric.lower()
    if "incident" in m or "damage" in m or "near miss" in m:
        return random.choices([0, 1], weights=[0.95, 0.05])[0]
    elif "recovery" in m:
        return round(random.uniform(75.0, 95.0), 1)
    elif "availability" in m or "utilization" in m:
        return round(random.uniform(70.0, 95.0), 1)
    elif "grade" in m:
        return round(random.uniform(0.5, 2.0), 2)
    elif "drilling" in m:
        return random.randint(100, 800)
    elif "tonne" in m or "crushed" in m or "mined" in m or "rehandle" in m or "stock pile" in m:
        return random.randint(3000, 6000)
    elif "moved" in m:
        return random.randint(10000, 20000)
    elif "toll" in m:
        return random.randint(0, 3000)
    elif "gold" in m: # Gold contained/recovered
        return random.randint(80, 250)
    else: # Engineering equip availability mostly percentage
        return round(random.uniform(30.0, 100.0), 1)

def format_val(val, metric):
    """Format as string mostly, percentages for recovery/equip."""
    m = metric.lower()
    if "recovery" in m or ("%" in m) or "truck" in m or "excavator" in m or "loader" in m or "grader" in m or "dozer" in m or "crusher" == m or "mill" == m or "vehicle" in m:
        return f"{val}%"
    return str(val)

def seed_data():
    start_date = date(2026, 1, 1)
    end_date = date(2026, 3, 31)
    delta = timedelta(days=1)
    
    with Session(engine) as session:
        # Check if we already seeded to avoid duplicates (optional, we could just delete old ones)
        print("Clearing old 2026 Q1 records just in case...")
        existing = session.exec(select(KPIRecord).where(KPIRecord.date >= start_date).where(KPIRecord.date <= end_date)).all()
        for record in existing:
            session.delete(record)
        session.commit()

        records_to_add = []
        
        for dept, metrics in DEPARTMENTS.items():
            print(f"Generating data for {dept}...")
            
            # State trackers for month-to-date
            mtd_state = {m: {"actual": 0.0, "forecast": 0.0} for m in metrics}
            current_month = start_date.month
            
            curr_date = start_date
            while curr_date <= end_date:
                # Reset MTD on new month
                if curr_date.month != current_month:
                    mtd_state = {m: {"actual": 0.0, "forecast": 0.0} for m in metrics}
                    current_month = curr_date.month
                
                for metric in metrics:
                    actual_val = generate_random_val(metric)
                    if dept == "OHS" or metric in ("Stock Pile Near Pit", "Stock Pile Main Rompad", "Grade Stockpile Near Pit", "Grade Stockpile Main Rompad"):
                        forecast_val = 0
                    else:
                        forecast_val = generate_random_val(metric)
                    
                    # Accumulate for MTD
                    if metric in ("Stock Pile Near Pit", "Stock Pile Main Rompad", "Grade Stockpile Near Pit", "Grade Stockpile Main Rompad"):
                        mtd_state[metric]["actual"] = actual_val
                        mtd_state[metric]["forecast"] = 0
                    else:
                        mtd_state[metric]["actual"] += actual_val
                        mtd_state[metric]["forecast"] += forecast_val
                    
                    actual_str = format_val(actual_val, metric)
                    forecast_str = format_val(forecast_val, metric)
                    
                    # Variance
                    if "incident" in metric.lower() or "damage" in metric.lower() or "near miss" in metric.lower():
                        # Less is better
                        var_val = forecast_val - actual_val 
                    else:
                        var_val = actual_val - forecast_val
                        
                    var_pct = 0
                    if forecast_val != 0:
                        var_pct = round((var_val / forecast_val) * 100)
                    else:
                        var_pct = 0 if actual_val == 0 else -100
                    
                    # MTD Variance
                    mtd_a = mtd_state[metric]["actual"]
                    if dept == "OHS":
                        annual_target = 0 if metric == "Environmental Incidents" else 24
                        mtd_f = annual_target / 12
                        mtd_v = mtd_f - mtd_a
                        if mtd_a != 0:
                            mtd_var_pct = round((mtd_v / mtd_a) * 100)
                        else:
                            mtd_var_pct = 0
                            
                        outlook_val = mtd_a + ((mtd_f - mtd_a) / curr_date.day)
                        if outlook_val != 0:
                            var3_pct = round(((mtd_f - outlook_val) / outlook_val) * 100)
                        else:
                            var3_pct = 0
                    else:
                        mtd_f = mtd_state[metric]["forecast"]
                        if "incident" in metric.lower() or "damage" in metric.lower() or "near miss" in metric.lower():
                            mtd_v = mtd_f - mtd_a
                        else:
                            mtd_v = mtd_a - mtd_f
                        
                        mtd_var_pct = 0
                        if mtd_f != 0:
                            mtd_var_pct = round((mtd_v / mtd_f) * 100)
                        
                    if dept == "OHS":
                        data = {
                            "daily_actual": actual_str,
                            "daily_forecast": "0",
                            "var1": f"{var_pct}%" if var_pct != 0 else "0%",
                            "mtd_actual": format_val(round(mtd_a, 2) if mtd_a % 1 else int(mtd_a), metric),
                            "mtd_forecast": str(round(mtd_f, 2) if mtd_f % 1 else int(mtd_f)),
                            "var2": f"{mtd_var_pct}%" if mtd_var_pct != 0 else "0%",
                            "outlook": str(round(outlook_val, 2) if outlook_val % 1 else int(outlook_val)),
                            "full_forecast": str(round(mtd_f, 2) if mtd_f % 1 else int(mtd_f)),
                            "full_budget": str(annual_target),
                            "annual_target": str(annual_target),
                            "var3": f"{var3_pct}%" if var3_pct != 0 else "0%",
                        }
                    elif dept == "Mining" and metric in ("Grade Rehandle", "Rehandle"):
                        data = {
                            "daily_actual": actual_str,
                            "daily_forecast": forecast_str,
                            "var1": f"{var_pct}%" if var_pct != 0 else "0%",
                            "mtd_actual": format_val(round(mtd_a, 2) if mtd_a % 1 else int(mtd_a), metric),
                            "mtd_forecast": format_val(round(mtd_f, 2) if mtd_f % 1 else int(mtd_f), metric),
                            "var2": f"{mtd_var_pct}%" if mtd_var_pct != 0 else "0%",
                            "outlook": "-",
                            "full_forecast": "-",
                            "full_budget": "-",
                            "var3": "-",
                        }
                    elif dept == "Mining" and metric in ("Stock Pile Near Pit", "Stock Pile Main Rompad"):
                        var1_str = "0%" if actual_val == 0 else "-"
                        var2_str = "0%" if mtd_a == 0 else "-"
                        data = {
                            "daily_actual": actual_str,
                            "daily_forecast": "0",
                            "var1": var1_str,
                            "mtd_actual": format_val(round(mtd_a, 2) if mtd_a % 1 else int(mtd_a), metric),
                            "mtd_forecast": "0",
                            "var2": var2_str,
                            "outlook": format_val(round(actual_val, 2) if actual_val % 1 else int(actual_val), metric),
                            "full_forecast": "-",
                            "full_budget": "-",
                            "var3": "-",
                        }
                    elif dept == "Mining" and metric in ("Grade Stockpile Near Pit", "Grade Stockpile Main Rompad"):
                        tonnes_val = random.randint(3000, 6000)
                        var1_str = "0%" if actual_val == 0 else "-"
                        var2_str = "0%" if mtd_a == 0 else "-"
                        data = {
                            "daily_actual": str(tonnes_val),
                            "daily_act_grade": actual_val,
                            "daily_forecast": 0,
                            "var1": var1_str,
                            "mtd_actual": actual_val,
                            "mtd_forecast": 0,
                            "var2": var2_str,
                            "outlook": actual_val,
                            "full_forecast": "-",
                            "full_budget": "-",
                            "var3": "-",
                        }
                    elif dept == "Mining" and metric in (
                        "Availability - Dump Truck",
                        "Utilization - Dump Truck",
                        "Availability - Excavator",
                        "Utilization - Excavator"
                    ):
                        data = {
                            "daily_actual": f"{round(actual_val)}%",
                            "daily_forecast": f"{round(forecast_val)}%",
                            "var1": f"{round(actual_val - forecast_val)}%",
                            "mtd_actual": "-",
                            "mtd_forecast": "-",
                            "var2": "-",
                            "outlook": "-",
                            "full_forecast": "-",
                            "full_budget": "-",
                            "var3": "-",
                        }
                    else:
                        data = {
                            "daily_actual": actual_str,
                            "daily_forecast": forecast_str,
                            "var1": f"{var_pct}%" if var_pct != 0 else "0%",
                            "mtd_actual": format_val(round(mtd_a, 2) if mtd_a % 1 else int(mtd_a), metric),
                            "mtd_forecast": format_val(round(mtd_f, 2) if mtd_f % 1 else int(mtd_f), metric),
                            "var2": f"{mtd_var_pct}%" if mtd_var_pct != 0 else "0%",
                            "outlook": format_val(round(mtd_a * 1.5, 1), metric),
                            "full_forecast": format_val(round(mtd_a * 1.4, 1), metric),
                            "full_budget": format_val(round(mtd_a * 1.6, 1), metric),
                            "var3": f"{random.randint(-20, 20)}%",
                        }
 
                    # Add specific sub-fields
                    if dept == "Engineering":
                        data["qty_available"] = random.randint(0, 10)
                    if dept == "Milling_CIL":
                        data["day_2"] = format_val(generate_random_val(metric), metric)
                        
                    record = KPIRecord(
                        department=dept,
                        date=curr_date,
                        metric_name=metric,
                        data=data
                    )
                    records_to_add.append(record)
                
                curr_date += delta
                
        # 2. Add Fixed Inputs
        print("Generating fixed inputs (monthly budgets & forecasts)...")
        months = [1, 2, 3] # Jan, Feb, Mar 2026
        for month in months:
            first_day = date(2026, month, 1)
            for dept, metrics in DEPARTMENTS.items():
                for metric in metrics:
                    if dept == "Mining" and metric in ("Grade Rehandle", "Rehandle", "Stock Pile Near Pit", "Stock Pile Main Rompad", "Grade Stockpile Near Pit", "Grade Stockpile Main Rompad", "Availability - Dump Truck", "Utilization - Dump Truck", "Availability - Excavator", "Utilization - Excavator"):
                        continue
                    if dept == "OHS":
                        annual_target = 0 if metric == "Environmental Incidents" else 24
                        forecast_str = str(annual_target / 12)
                        budget_str = str(annual_target)
                    else:
                        base_forecast = generate_random_val(metric)
                        base_budget = int(base_forecast * random.uniform(0.9, 1.3))

                        # Format properly with percentages if needed
                        forecast_str = format_val(base_forecast, metric).replace('%', '') if "%" in format_val(base_forecast, metric) else str(base_forecast)
                        budget_str = format_val(base_budget, metric).replace('%', '') if "%" in format_val(base_budget, metric) else str(base_budget)

                    # Some fields like "Available Rig Options" might be in fixed inputs depending on department
                    data = {
                        "full_forecast": forecast_str,
                        "full_budget": budget_str,
                    }

                    if dept == "OHS":
                        data["annual_target"] = budget_str
                    if "Grade Control" in metric:
                        data["available_rig_options"] = [80, 150, 230, 300]

                    record = KPIRecord(
                        department=dept,
                        date=first_day,
                        metric_name=metric,
                        subtype="fixed_input",
                        data=data
                    )
                    records_to_add.append(record)
                    
        print(f"Adding {len(records_to_add)} records to database...")
        session.add_all(records_to_add)
        session.commit()
        print("Success! Database seeded.")

if __name__ == "__main__":
    seed_data()
