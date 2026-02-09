from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from datetime import date, timedelta, datetime
import os

# Relative imports from within the backend package
from .database import create_db_and_tables, get_session
from .models import KPIRecord

app = FastAPI()

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# API Endpoints
@app.post("/api/login")
def login(data: Dict[str, Any]):
    # Mock login logic
    username = data.get("username")
    # In a real app, verify credentials.
    # For now, return a mock user based on input or default to Admin.
    return {
        "token": "mock-token-xyz",
        "user": {
            "name": username or "Admin User", 
            "role": "Admin",
            "department": "IT" 
        }
    }



@app.get("/api/kpi/{department}", response_model=List[KPIRecord])
def get_kpi_records(
    department: str, 
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None,
    session: Session = Depends(get_session)
):
    query = select(KPIRecord).where(KPIRecord.department == department)
    if start_date:
        query = query.where(KPIRecord.date >= start_date)
    if end_date:
        query = query.where(KPIRecord.date <= end_date)
    return session.exec(query).all()

@app.post("/api/kpi/{department}", response_model=KPIRecord)
def create_kpi_record(department: str, record: KPIRecord, session: Session = Depends(get_session)):
    try:
        # 1. Force date conversion if it's a string (fixes SQLite error)
        if isinstance(record.date, str):
            record.date = datetime.strptime(record.date, "%Y-%m-%d").date()

        # Check for existing record to prevent duplicates (Upsert logic)
        existing_stmt = select(KPIRecord).where(
            KPIRecord.department == department,
            KPIRecord.date == record.date,
            KPIRecord.metric_name == record.metric_name,
            KPIRecord.subtype == record.subtype
        )
        existing = session.exec(existing_stmt).first()
        
        if existing:
            # Update existing
            existing.data = record.data
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
        else:
            # Create new
            record.department = department
            session.add(record)
            session.commit()
            session.refresh(record)
            return record
    except Exception as e:
        print(f"ERROR creating KPI record: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@app.get("/api/kpi/{department}/previous-mtd")
def get_previous_mtd(
    department: str, 
    metric: str, 
    current_date: date, 
    subtype: Optional[str] = None,
    session: Session = Depends(get_session)
):
    # Find record for date - 1
    prev_date = current_date - timedelta(days=1)
    query = select(KPIRecord).where(
        KPIRecord.department == department,
        KPIRecord.date == prev_date,
        KPIRecord.metric_name == metric
    )
    if subtype:
        query = query.where(KPIRecord.subtype == subtype)
        
    record = session.exec(query).first()
    if record and record.data:
        # Return whatever is stored in 'mtd_actual'
        return {"mtd_actual": record.data.get("mtd_actual", 0)}
    
    return {"mtd_actual": 0}

@app.delete("/api/kpi/{record_id}")
def delete_kpi_record(record_id: int, session: Session = Depends(get_session)):
    record = session.get(KPIRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    session.delete(record)
    session.commit()
    return {"ok": True}

# Serve Frontend Static Files
# We assume the backend is run from the project root (e.g. uvicorn backend.main:app)
# So "../frontend" might need adjustment if run from inside backend folder.
# Let's find the absolute path to be safe.
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_path = os.path.join(current_dir, "..", "frontend")

if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")
else:
    print(f"Warning: Frontend not found at {frontend_path}")
