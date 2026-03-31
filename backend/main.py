from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select, or_
from typing import List, Optional, Dict, Any
from datetime import date, timedelta, datetime
from pydantic import BaseModel
from jose import JWTError, jwt
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Relative imports from within the backend package
from .database import create_db_and_tables, get_session
from .models import KPIRecord, User
from . import security

app = FastAPI()

# ---------------------------------------------------------------------------
# Email helper
# ---------------------------------------------------------------------------

def send_confirmation_email(to_address: str, username: str) -> None:
    """Send an account-confirmation email to the new admin.
    All SMTP settings are sourced from environment variables.
    Failures are logged but never raise so registration is never blocked.
    """
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)
    app_name = os.getenv("APP_NAME", "Adamus KPI")

    if not smtp_host or not smtp_user or not to_address:
        logger.warning(
            "Email not sent: SMTP_HOST, SMTP_USER, or recipient address is missing."
        )
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Welcome to {app_name} – Admin Account Created"
        msg["From"] = smtp_from
        msg["To"] = to_address

        html_body = f"""\
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color:#0d6efd;">Welcome to {app_name}!</h2>
    <p>Hi <strong>{username}</strong>,</p>
    <p>Your administrator account has been successfully created.</p>
    <p style="margin-top:24px;">You can now log in using your username and the password you chose during setup.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:12px;color:#888;">If you did not create this account, please contact your system administrator immediately.</p>
  </body>
</html>
"""
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, to_address, msg.as_string())

        logger.info("Confirmation email sent to %s", to_address)
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to send confirmation email to %s: %s", to_address, exc)

class CascadeFixedRequest(BaseModel):
    metric_name: str
    target_month: str # YYYY-MM
    full_forecast: float
    full_budget: float
    forecast_per_rig: Optional[float] = None

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Auth Infrastructure
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/token")

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = "user"

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = False
    department: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None
    disabled: Optional[bool] = None

class PasswordReset(BaseModel):
    new_password: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str


async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_admin(current_user: User = Depends(get_current_active_user)):
    """Dependency that raises HTTP 403 if the current user is not an Admin."""
    if (current_user.role or "").lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

# API Endpoints


@app.get("/api/setup-required")
def check_setup_required(session: Session = Depends(get_session)):
    user = session.exec(select(User)).first()
    return {"setup_required": user is None}

@app.post("/api/register", response_model=User)
def register_user(user: UserCreate, session: Session = Depends(get_session)):
    # Check if this is the first user
    first_user = session.exec(select(User)).first()
    is_first_user = first_user is None

    statement = select(User).where(User.username == user.username)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Force Admin role if first user
    role = user.role
    if is_first_user:
        role = "Admin"

    hashed_password = security.get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        department=user.department,
        role=role,
        phone_number=user.phone_number
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    # Send confirmation email to the first (admin) user if they provided an address
    if is_first_user and db_user.email:
        send_confirmation_email(db_user.email, db_user.username)

    return db_user

@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login")
def login(data: Dict[str, Any], session: Session = Depends(get_session)):
    # Support for JSON based login from frontend
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
         raise HTTPException(status_code=400, detail="Username and password required")

    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    
    if user and security.verify_password(password, user.hashed_password):
        # Valid user
        access_token = security.create_access_token(data={"sub": user.username})
        return {
            "token": access_token,
            "user": {
                "id": user.id,
                "name": user.full_name or user.username,
                "username": user.username,
                "role": user.role,
                "department": user.department
            }
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")



# ---------------------------------------------------------------------------
# Self-Service: Current User Profile
# ---------------------------------------------------------------------------

@app.get("/api/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_active_user)):
    """Return the authenticated user's own profile."""
    return current_user

@app.post("/api/me/change-password")
async def change_my_password(
    payload: ChangePassword,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Allow the authenticated user to change their own password."""
    if not security.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = security.get_password_hash(payload.new_password)
    session.add(current_user)
    session.commit()
    return {"message": "Password changed successfully"}

# ---------------------------------------------------------------------------
# Admin: User Management Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/users", response_model=List[UserResponse])
def list_users(
    _admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """(Admin) Return all registered users."""
    return session.exec(select(User)).all()

@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    _admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """(Admin) Fetch a single user by ID."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/api/users", response_model=UserResponse)
def admin_create_user(
    user: UserCreate,
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """(Admin) Create a new user account."""
    existing = session.exec(select(User).where(User.username == user.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=security.get_password_hash(user.password),
        department=user.department,
        role=user.role or "user",
        phone_number=user.phone_number,
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """(Admin) Update a user's profile fields."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.patch("/api/users/{user_id}/status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """(Admin) Toggle a user's disabled/enabled status."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own account status")
    user.disabled = not user.disabled
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.post("/api/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    payload: PasswordReset,
    _admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """(Admin) Forcibly reset a user's password."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not payload.new_password or len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user.hashed_password = security.get_password_hash(payload.new_password)
    session.add(user)
    session.commit()
    return {"message": f"Password reset successfully for user '{user.username}'"}

# ---------------------------------------------------------------------------
# Summary Dashboard
# ---------------------------------------------------------------------------

SUMMARY_DEPARTMENTS = ["OHS", "Milling_CIL", "Crushing", "Mining", "Geology", "Engineering"]

@app.get("/api/summary-dashboard")
def get_summary_dashboard(
    target_date: date = Query(..., description="The date to show the summary for"),
    session: Session = Depends(get_session),
):
    """Aggregate latest KPI data across all departments for the given date."""
    trend_start = target_date - timedelta(days=6)

    # Single query for all departments in the 7-day window, exclude fixed_input
    all_records = session.exec(
        select(KPIRecord).where(
            KPIRecord.date >= trend_start,
            KPIRecord.date <= target_date,
            or_(KPIRecord.subtype != "fixed_input", KPIRecord.subtype == None),
        )
    ).all()

    result = {}
    for dept in SUMMARY_DEPARTMENTS:
        dept_records = [r for r in all_records if r.department == dept]
        today_records = [r for r in dept_records if r.date == target_date]

        metrics_data = []
        seen = set()
        for rec in today_records:
            if rec.metric_name in seen:
                continue
            seen.add(rec.metric_name)

            # Build 7-day trend of daily_actual
            trend = []
            for d in range(7):
                check_d = trend_start + timedelta(days=d)
                match = next(
                    (r for r in dept_records if r.metric_name == rec.metric_name and r.date == check_d),
                    None,
                )
                if match:
                    raw = match.data.get("daily_actual")
                    try:
                        cleaned = str(raw).replace("%", "").replace(",", "").strip() if raw is not None else None
                        trend.append(float(cleaned) if cleaned else None)
                    except (ValueError, TypeError):
                        trend.append(None)
                else:
                    trend.append(None)

            metrics_data.append({
                "metric_name": rec.metric_name,
                "data": rec.data,
                "trend": trend,
            })

        result[dept] = metrics_data

    return {"date": target_date.isoformat(), "departments": result}

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
def create_kpi_record(department: str, record: KPIRecord, session: Session = Depends(get_session), _user: User = Depends(get_current_active_user)):
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
def delete_kpi_record(record_id: int, session: Session = Depends(get_session), _user: User = Depends(get_current_active_user)):
    record = session.get(KPIRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    session.delete(record)
    session.commit()
    return {"ok": True}

@app.post("/api/kpi/{department}/cascade-fixed")
def cascade_fixed_input(
    department: str,
    payload: CascadeFixedRequest,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_active_user),
):
    try:
        # Parse Month
        year, month = map(int, payload.target_month.split('-'))
        start_date = date(year, month, 1)
        # End date is start of next month
        if month == 12:
            next_month = date(year + 1, 1, 1)
        else:
            next_month = date(year, month + 1, 1)

        # Query all records for this metric in this month, EXCLUDING fixed_input
        # We need to fetch records and iterate to update specific fields in the JSON
        query = select(KPIRecord).where(
            KPIRecord.department == department,
            KPIRecord.metric_name == payload.metric_name,
            KPIRecord.date >= start_date,
            KPIRecord.date < next_month,
            KPIRecord.subtype != 'fixed_input'
        )
        records = session.exec(query).all()
        
        count = 0
        for record in records:
            # Need to create a new dict to ensure SQLAlchemy detects change in JSON
            new_data = dict(record.data)
            new_data['full_forecast'] = payload.full_forecast
            new_data['full_budget'] = payload.full_budget
            
            # Helper for variance
            def calc_var(act_val, fcst_val, is_ohs=False):
                try:
                    act = float(act_val)
                    fcst = float(fcst_val)
                    
                    if is_ohs:
                        # OHS Logic (Lower is Better)
                        # If Forecast is 0:
                        # - Actual 0 -> 0% (Green/Good)
                        # - Actual > 0 -> -100% (Red/Bad)
                        if fcst == 0:
                            if act == 0:
                                return "0%"
                            else:
                                return "-100%"
                        
                        # Normal OHS Logic: ((Forecast - Actual) / Forecast) * 100
                        # Example: Fcst 10, Act 5. (5/10)*100 = 50% (Good)
                        # Example: Fcst 10, Act 15. (-5/10)*100 = -50% (Bad)
                        var = ((fcst - act) / fcst) * 100
                        return f"{round(var)}%"
                    
                    else:
                        # Standard Logic (Higher is Better/Production)
                        # If Forecast is 0, we can't calculate variance. Return "-" or maybe "0%"?
                        # Standard practice in this app seems to be "-" if invalid.
                        # However, user complained about "-". 
                        # If Forecast is 0 and Actual is > 0, technically it's infinite variance.
                        if fcst == 0:
                            if act == 0:
                                return "0%"
                            return "-" # Keep as - for non-OHS if forecast is 0, unless user specifies otherwise for all.

                        var = ((act - fcst) / fcst) * 100
                        return f"{round(var)}%"
                except (ValueError, TypeError):
                    return ""

            is_ohs_dept = department == "OHS"

            # Special case for Geology Grade Control: forecast_per_rig changes daily_forecast
            if payload.forecast_per_rig is not None:
                new_data['forecast_per_rig'] = payload.forecast_per_rig
                # Update daily forecast based on qty_available (rigs) * forecast_per_rig
                if 'qty_available' in new_data:
                    try:
                        rigs = float(new_data['qty_available'])
                        new_daily_fcst = rigs * float(payload.forecast_per_rig)
                        new_data['daily_forecast'] = round(new_daily_fcst, 2)
                    except (ValueError, TypeError):
                         pass

            # Recalculate Daily Variance (var1)
            # Logic: ((Actual - Forecast) / Forecast) * 100
            if 'daily_actual' in new_data and 'daily_forecast' in new_data:
                 new_data['var1'] = calc_var(new_data['daily_actual'], new_data['daily_forecast'], is_ohs_dept)

            # Recalculate MTD Variance (var2)
            # Logic: ((MTD Actual - MTD Forecast) / MTD Forecast) * 100
            if 'mtd_actual' in new_data and 'mtd_forecast' in new_data:
                 new_data['var2'] = calc_var(new_data['mtd_actual'], new_data['mtd_forecast'], is_ohs_dept)

            # Recalculate Budget Variance (var3)
            # Logic: ((Full Forecast - Full Budget) / Full Budget) * 100
            # Note: The logic in JS is Budget Variance = (Full Forecast - Full Budget) / Full Budget
            # But wait, looking at app.js line 1408: attachVarianceListener(outlook.input, fullBudg.input, budgVar.input);
            # It uses the SAME logic: (Actual - Forecast) / Forecast.
            # Where 'Actual' is dependent on the context.
            # For Fixed Input context: 'Outlook' vs 'Full Forecast'? No.
            # Let's stick to (Full Forecast - Full Budget) / Full Budget as standard Budget Variance.
            # Actually, let's use the helper: Act=Full Forecast, Fcst=Full Budget
            new_data['var3'] = calc_var(payload.full_forecast, payload.full_budget, is_ohs_dept)

            record.data = new_data
            session.add(record)
            count += 1
            
        session.commit()
        return {"updated_count": count}

    except Exception as e:
        print(f"ERROR cascading fixed input: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

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
