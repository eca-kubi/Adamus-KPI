from fastapi import FastAPI, Depends, HTTPException, Query, Request, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from .cache_static import CacheAwareStaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlmodel import Session, select, or_
from typing import List, Optional, Dict, Any
from datetime import date, timedelta, datetime, timezone
from pydantic import BaseModel
from jose import JWTError, jwt
import os
import smtplib
import logging
import resend
import random
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv


load_dotenv()
logger = logging.getLogger(__name__)

# Relative imports from within the backend package
from .database import create_db_and_tables, get_session
from .models import KPIRecord, User
from . import security
from .profiler import ProfilingMiddleware, monitor_memory
import asyncio

# ---------------------------------------------------------------------------
# Rate limiting — keyed by client IP address
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(ProfilingMiddleware)

# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def parse_optional_float(val):
    if val is None or val == "" or val == "-":
        return None
    try:
        return float(str(val).replace("%", "").replace(",", "").strip())
    except (ValueError, TypeError):
        return None

def sum_or_none(iterable):
    vals = [v for v in iterable if v is not None]
    if not vals:
        return None
    return sum(vals)

# ---------------------------------------------------------------------------
# Email helper
# ---------------------------------------------------------------------------

def is_adamus_email(email: str) -> bool:
    """Validate that the email belongs to the @adamusgh.com domain."""
    if not email:
        return False
    return email.lower().strip().endswith("@adamusgh.com")

def send_confirmation_email(to_address: str, username: str) -> None:
    """Send an account-confirmation email to the new user.
    Can use either SMTP or Resend based on EMAIL_PROVIDER setting.
    Failures are logged but never raise so registration is never blocked.
    Now with enhanced design and branding.
    """
    provider = os.getenv("EMAIL_PROVIDER", "smtp").lower()
    app_name = os.getenv("APP_NAME", "Adamus KPI")
    app_url = os.getenv("APP_URL", "https://adamusgh.com")

    if not to_address:
        logger.warning("Email not sent: recipient address is missing.")
        return
    
    if not is_adamus_email(to_address):
        logger.warning("Email skip: recipient address '%s' not an adamusgh.com address.", to_address)
        return

    # Premium Email HTML Body
    html_body = f"""\
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }}
    .header {{ background: #0f172a; color: #ffffff; padding: 30px; text-align: center; }}
    .content {{ padding: 40px; background-color: #ffffff; }}
    .footer {{ background: #f8fafc; color: #64748b; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e2e8f0; }}
    .button {{ display: inline-block; padding: 12px 24px; background-color: #d2ab67; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }}
    .h1 {{ margin: 0; font-size: 24px; color: #ffffff; }}
    .highlight {{ color: #020617; font-weight: 600; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="h1">Adamus KPI Portal</div>
    </div>
    <div class="content">
      <h2 style="color: #0f172a; margin-top: 0;">Welcome aboard!</h2>
      <p>Hi <span class="highlight">{username}</span>,</p>
      <p>Your account for the <span class="highlight">{app_name}</span> has been successfully created. You now have access to monitor and manage key performance indicators across the organization.</p>
      
      <p style="margin-top: 24px;">Please use your username and the password provided by your administrator to sign in.</p>
      
      <center>
        <a href="{app_url}" class="button">Access KPI Portal</a>
      </center>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      <p style="font-size: 13px;">If you did not expect this email, please contact the IT Service Desk immediately.</p>
    </div>
    <div class="footer">
      &copy; {datetime.now().year} Adamus Resources Limited. All rights reserved.<br>
      Confidential Organization Monitoring System
    </div>
  </div>
</body>
</html>
"""

    if provider == "resend":
        resend_api_key = os.getenv("RESEND_API_KEY", "")
        resend_from = os.getenv("RESEND_FROM", "onboarding@resend.dev")
        if not resend_api_key:
            logger.warning("Email not sent: RESEND_API_KEY is missing.")
            return
        
        resend.api_key = resend_api_key
        try:
            params = {
                "from": resend_from,
                "to": [to_address],
                "subject": f"Welcome to {app_name} – Your Account is Ready",
                "html": html_body,
            }
            resend.Emails.send(params)
            logger.info("Confirmation email sent to %s via Resend", to_address)
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to send Resend email to %s: %s", to_address, exc)

    else:
        # Default to SMTP
        smtp_host = os.getenv("SMTP_HOST", "")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        smtp_from = os.getenv("SMTP_FROM", smtp_user)

        if not smtp_host or not smtp_user:
            logger.warning("Email not sent: SMTP_HOST or SMTP_USER is missing.")
            return

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Welcome to {app_name} – Your Account is Ready"
            msg["From"] = smtp_from
            msg["To"] = to_address
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_from, to_address, msg.as_string())
            logger.info("Confirmation email sent to %s via SMTP", to_address)
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to send SMTP email to %s: %s", to_address, exc)

def send_password_reset_email(to_address: str, username: str, code: str) -> None:
    """Send a password reset email containing a 6-digit verification code.
    Can use either SMTP or Resend based on EMAIL_PROVIDER setting.
    """
    provider = os.getenv("EMAIL_PROVIDER", "smtp").lower()
    app_name = os.getenv("APP_NAME", "Adamus KPI")
    app_url = os.getenv("APP_URL", "https://adamusgh.com")
    simulate = os.getenv("SIMULATE_NOTIFICATIONS", "false").lower() == "true"

    if simulate:
        logger.info("[SIMULATION] Email to %s: Reset code is %s", to_address, code)
        print(f"[SIMULATION] Email to {to_address}: Reset code is {code}", flush=True)
        return


    if not to_address:

        logger.warning("Email not sent: recipient address is missing.")
        return
    
    if not is_adamus_email(to_address):
        logger.warning("Email skip: recipient address '%s' not an adamusgh.com address.", to_address)
        return

    # Premium Email HTML Body
    html_body = f"""\
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }}
    .header {{ background: #0f172a; color: #ffffff; padding: 30px; text-align: center; }}
    .content {{ padding: 40px; background-color: #ffffff; }}
    .footer {{ background: #f8fafc; color: #64748b; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e2e8f0; }}
    .code-box {{ font-size: 32px; font-weight: 700; color: #d2ab67; text-align: center; margin: 30px 0; letter-spacing: 5px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px dashed #d2ab67; }}
    .h1 {{ margin: 0; font-size: 24px; color: #ffffff; }}
    .highlight {{ color: #020617; font-weight: 600; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="h1">Adamus KPI Portal</div>
    </div>
    <div class="content">
      <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
      <p>Hi <span class="highlight">{username}</span>,</p>
      <p>We received a request to reset your password for the <span class="highlight">{app_name}</span>. Please use the following 6-digit verification code to complete your password reset:</p>
      
      <div class="code-box">{code}</div>
      
      <p>This code will expire in 15 minutes. If you did not request a password reset, please ignore this email or contact your administrator immediately.</p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
      <p style="font-size: 13px;">If you have any questions, please contact the IT Service Desk.</p>
    </div>
    <div class="footer">
      &copy; {datetime.now().year} Adamus Resources Limited. All rights reserved.<br>
      Confidential Organization Monitoring System
    </div>
  </div>
</body>
</html>
"""

    if provider == "resend":
        resend_api_key = os.getenv("RESEND_API_KEY", "")
        resend_from = os.getenv("RESEND_FROM", "onboarding@resend.dev")
        if not resend_api_key:
            logger.warning("Email not sent: RESEND_API_KEY is missing.")
            return
        
        resend.api_key = resend_api_key
        try:
            params = {
                "from": resend_from,
                "to": [to_address],
                "subject": f"Reset Your Password - {app_name}",
                "html": html_body,
            }
            resend.Emails.send(params)
            logger.info("Password reset email sent to %s via Resend", to_address)
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to send Resend email to %s: %s", to_address, exc)

    else:
        # Default to SMTP
        smtp_host = os.getenv("SMTP_HOST", "")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        smtp_from = os.getenv("SMTP_FROM", smtp_user)

        if not smtp_host or not smtp_user:
            logger.warning("Email not sent: SMTP_HOST or SMTP_USER is missing.")
            return

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"Reset Your Password - {app_name}"
            msg["From"] = smtp_from
            msg["To"] = to_address
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(smtp_from, to_address, msg.as_string())
            logger.info("Password reset email sent to %s via SMTP", to_address)
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to send SMTP email to %s: %s", to_address, exc)

def normalize_phone_number(phone: str) -> str:
    """Normalize phone number to digits-only international format (Ghana default 233)."""
    if not phone:
        return ""
    digits = "".join(c for c in phone if c.isdigit())
    if digits.startswith("233") and len(digits) >= 12:
        return digits
    if digits.startswith("0") and len(digits) == 10:
        return "233" + digits[1:]
    return digits

def send_sms(text: str, recipient: str) -> dict:
    """Send SMS via SMSOnlineGH. Supports simulation mode."""
    api_key = os.getenv("SMS_ONLINE_GH_API_KEY")
    sender = os.getenv("SMS_ONLINE_GH_SENDER_ID", "MONITOR")
    simulate = os.getenv("SIMULATE_NOTIFICATIONS", "false").lower() == "true"

    if not api_key or not recipient:
        if simulate:
            log_msg = f'[SIMULATION] SMS to {recipient or "unknown"}: "{text}"'
            logger.info(log_msg)
            print(log_msg, flush=True)
            return {"status": "simulated", "details": log_msg}
        logger.error("Configuration Error: SMS_ONLINE_GH_API_KEY is missing or recipient is invalid.")
        return {"status": "failed", "details": "Configuration Error: SMS_ONLINE_GH_API_KEY is missing."}

    if simulate:
        log_msg = f'[SIMULATION] SMS to {recipient}: "{text}"'
        logger.info(log_msg)
        print(log_msg, flush=True)
        return {"status": "simulated", "details": log_msg}


    # Normalize recipient number to international digits-only
    clean_recipient = normalize_phone_number(recipient)

    
    try:
        response = requests.post(
            "https://api.smsonlinegh.com/v5/message/sms/send",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": f"key {api_key}"
            },
            json={
                "text": text,
                "sender": sender,
                "destinations": [clean_recipient],
                "type": 0
            },
            timeout=10.0
        )
        response.raise_for_status()
        data = response.json()
        
        # SMSOnlineGH Handshake Validation
        if data and "handshake" in data and data["handshake"].get("label") != "HSHK_OK":
            err_lbl = data["handshake"].get("label")
            err_id = data["handshake"].get("id")
            raise Exception(f"SMSOnlineGH API Error: {err_lbl} (ID: {err_id})")
            
        logger.info("[SMS] SMS sent successfully via SMSOnlineGH: %s", data)
        return {"status": "sent", "details": str(data)}
    except Exception as exc:
        logger.error("[SMS] Failed to send SMS via SMSOnlineGH: %s", exc)
        return {"status": "failed", "details": str(exc)}

class CascadeFixedRequest(BaseModel):
    metric_name: str
    target_month: str # YYYY-MM
    full_forecast: float
    full_budget: float
    annual_target: Optional[float] = None
    forecast_per_rig: Optional[float] = None

class KPIImportRecord(BaseModel):
    date: date
    metric_name: str
    subtype: Optional[str] = "daily_input"
    data: Dict[str, Any]

class KPIRecordResponse(BaseModel):
    id: Optional[int] = None
    department: str
    subtype: Optional[str] = None
    date: date
    metric_name: str
    data: Dict[str, Any]
    created_by_user_id: Optional[int] = None
    created_by_username: Optional[str] = None
    created_by_full_name: Optional[str] = None
    created_at: Optional[datetime] = None
    last_modification: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

@app.on_event("startup")
async def on_startup():
    # create_db_and_tables() 
    # Start memory monitoring in the background
    asyncio.create_task(monitor_memory(interval_seconds=300)) # Log every 5 mins

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
    departments: Optional[List[str]] = []
    role: Optional[str] = "Staff"
    allowed_metrics: Optional[List[str]] = []

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = False
    departments: Optional[List[str]] = []
    role: Optional[str] = None
    phone_number: Optional[str] = None
    allowed_metrics: Optional[List[str]] = []

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    departments: Optional[List[str]] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None
    disabled: Optional[bool] = None
    allowed_metrics: Optional[List[str]] = None

class PasswordReset(BaseModel):
    new_password: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    identity: str

class ResetPasswordRequest(BaseModel):
    identity: str
    code: str
    new_password: str


# ---------------------------------------------------------------------------
# Metric Mapping Constants
# ---------------------------------------------------------------------------

DEPARTMENT_METRICS = {
    "Milling_CIL": ["Fixed Inputs", "Gold Contained", "Gold Recovery", "Recovery", "Plant Feed Grade", "Tonnes Treated", "Runtime", "Throughput", "Toll Tonnes", "Toll Grade"],
    "Geology": ["Fixed Inputs", "Exploration Drilling", "Grade Control Drilling", "Toll"],
    "Mining": ["Fixed Inputs", "Total Material Mined", "Ore Mined", "Ore Mined Grade", "Rehandle", "Rehandle Grade", "Near Pit Ore Stockpile", "Near Pit Ore Stockpile Grade", "Main Rompad Stockpile", "Main Rompad Ore Stockpile Grade", "Availability - Dump Trucks", "Utilization - Dump Trucks", "Productivity - Dump Trucks", "Availability - Excavators", "Utilization - Excavators", "Productivity - Excavators", "Availability - Tipper Trucks", "Utilization - Tipper Trucks", "Productivity - Tipper Trucks", "Availability - Drill Rigs", "Utilization - Drill Rigs", "Productivity - Drill Rigs", "Blast Hole Drilling"],
    "Crushing": ["Fixed Inputs", "Grade - Ore Crushed", "Ore Crushed"],
    "OHS": ["Fixed Inputs", "Safety Incidents", "Environmental Incidents", "Property Damage", "Near Miss"],
    "Engineering": ["Fixed Inputs", "Tipper Trucks", "Light Vehicles", "Prime Excavators", "Ancillary Excavators", "Articulated Dump Trucks", "Drill Rigs", "Dump Truck (CAT 777E)", "Dump Truck (Liebherr T236)", "Dozers", "Graders", "Wheel Loaders", "Dewatering Pumps", "Crusher", "Mill"]
}

def get_allowed_metrics_for_departments(departments: List[str]) -> List[str]:
    """Calculate the allowed metrics based on the list of selected departments."""
    if not departments:
        return []
    
    # If "All" is selected, return all metrics from all departments
    if "All" in departments:
        all_metrics = set()
        for metrics in DEPARTMENT_METRICS.values():
            all_metrics.update(metrics)
        return list(all_metrics)
    
    # Otherwise, collect metrics for each selected department
    allowed = set()
    for dept in departments:
        if dept in DEPARTMENT_METRICS:
            allowed.update(DEPARTMENT_METRICS[dept])
    return list(allowed)


def get_current_allowed_metrics(user: User) -> List[str]:
    """Return the current metrics a user is allowed to edit.

    This is derived from the user's departments and the current
    DEPARTMENT_METRICS mapping.  Using the live mapping instead of the
    cached ``allowed_metrics`` column means that newly added metrics are
    automatically available to users whose departments already include them,
    without requiring a manual cache refresh or database migration.
    """
    return get_allowed_metrics_for_departments(user.departments or [])


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
def register_user(user: UserCreate, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    # Validate adamus email if provided
    if user.email and not is_adamus_email(user.email):
         raise HTTPException(status_code=400, detail="Only @adamusgh.com email addresses are allowed")

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
    # Automatic metric mapping for the first admin or any registered user
    allowed_metrics = get_allowed_metrics_for_departments(user.departments or [])
    
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        departments=user.departments or [],
        role=role,
        phone_number=user.phone_number,
        allowed_metrics=allowed_metrics
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    # Send confirmation email for all user creations if they provided an adamus address
    if db_user.email:
        background_tasks.add_task(send_confirmation_email, db_user.email, db_user.username)

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
@limiter.limit("10/minute")
def login(request: Request, data: Dict[str, Any], session: Session = Depends(get_session)):
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
                "departments": user.departments or [],
                "allowed_metrics": get_current_allowed_metrics(user)
            }
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/forgot-password")
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """Generate password reset code and send it via registered email or SMS."""
    identity = payload.identity.strip()
    if not identity:
        raise HTTPException(status_code=400, detail="Email or phone number is required")

    # Search for user by email (case-insensitive) or phone number
    statement = select(User).where(
        (User.email == identity) | (User.phone_number == identity)
    )
    user = session.exec(statement).first()

    # Case-insensitive checks for email and normalized phone number checks
    if not user:
        statement_all = select(User)
        users = session.exec(statement_all).all()
        normalized_identity = normalize_phone_number(identity)
        for u in users:
            if u.email and u.email.strip().lower() == identity.lower():
                user = u
                break
            if u.phone_number and normalize_phone_number(u.phone_number) == normalized_identity:
                user = u
                break

    if not user:
        raise HTTPException(
            status_code=400,
            detail="No user found with the registered email address or phone number."
        )

    # Generate 6-digit verification code
    code = f"{random.randint(100000, 999999)}"
    user.reset_code = code
    # Code is valid for 15 minutes
    user.reset_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    session.add(user)
    session.commit()

    # Determine delivery method
    is_email = False
    normalized_identity = normalize_phone_number(identity)
    if user.email and user.email.strip().lower() == identity.lower():
        is_email = True
    elif user.phone_number and normalize_phone_number(user.phone_number) == normalized_identity:
        is_email = False
    elif user.email:
        # Fallback to email if user has both
        is_email = True
    else:
        is_email = False


    if is_email:
        background_tasks.add_task(send_password_reset_email, user.email, user.username, code)
        return {
            "message": "A reset code has been sent to your registered email address.",
            "delivery_method": "email"
        }
    else:
        # Send SMS via background tasks
        sms_text = f"Your Adamus KPI password reset verification code is {code}. It is valid for 15 minutes."
        background_tasks.add_task(send_sms, sms_text, user.phone_number)
        return {
            "message": "A reset code has been sent to your registered phone number.",
            "delivery_method": "sms"
        }

@app.post("/api/reset-password")
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    session: Session = Depends(get_session)
):
    """Verify reset code and update user's password."""
    identity = payload.identity.strip()
    code = payload.code.strip()
    new_password = payload.new_password

    if not identity or not code or not new_password:
        raise HTTPException(status_code=400, detail="All fields (identity, code, new_password) are required")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Find user by email or phone
    statement = select(User).where(
        (User.email == identity) | (User.phone_number == identity)
    )
    user = session.exec(statement).first()

    # Case-insensitive checks
    if not user:
        statement_all = select(User)
        users = session.exec(statement_all).all()
        normalized_identity = normalize_phone_number(identity)
        for u in users:
            if u.email and u.email.strip().lower() == identity.lower():
                user = u
                break
            if u.phone_number and normalize_phone_number(u.phone_number) == normalized_identity:
                user = u
                break


    if not user:
        raise HTTPException(
            status_code=400,
            detail="No user found with the registered email address or phone number."
        )

    # Check reset code
    if not user.reset_code or user.reset_code != code:
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    # Check code expiration
    now = datetime.now(timezone.utc)
    expires_at = user.reset_code_expires_at
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
        
        if now > expires_at:
            raise HTTPException(status_code=400, detail="Verification code has expired.")
    else:
        raise HTTPException(status_code=400, detail="No verification code was requested.")

    # Reset password
    user.hashed_password = security.get_password_hash(new_password)
    user.reset_code = None
    user.reset_code_expires_at = None
    
    session.add(user)
    session.commit()

    return {"message": "Your password has been successfully reset. You can now log in."}




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
    background_tasks: BackgroundTasks,
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """(Admin) Create a new user account."""
    if user.email and not is_adamus_email(user.email):
         raise HTTPException(status_code=400, detail="Only @adamusgh.com email addresses are allowed")

    existing = session.exec(select(User).where(User.username == user.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    # Calculate metrics
    allowed_metrics = get_allowed_metrics_for_departments(user.departments or [])

    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=security.get_password_hash(user.password),
        departments=user.departments or [],
        role=user.role or "Staff",
        phone_number=user.phone_number,
        allowed_metrics=allowed_metrics,
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    # Send confirmation email for all user creations if they provided an adamus address
    if db_user.email:
        background_tasks.add_task(send_confirmation_email, db_user.email, db_user.username)

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
    
    if payload.email and not is_adamus_email(payload.email):
         raise HTTPException(status_code=400, detail="Only @adamusgh.com email addresses are allowed")

    if payload.username:
        payload.username = payload.username.strip()
        if not payload.username:
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        existing = session.exec(select(User).where(User.username == payload.username, User.id != user_id)).first()
        if existing:
            raise HTTPException(status_code=409, detail="Username already taken")

    update_data = payload.model_dump(exclude_unset=True)
    
    # If departments are updated, automatically recalculate allowed_metrics
    if "departments" in update_data:
        update_data["allowed_metrics"] = get_allowed_metrics_for_departments(update_data["departments"])

    for field, value in update_data.items():
        setattr(user, field, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.post("/api/admin/resync-allowed-metrics")
def resync_allowed_metrics(
    _admin: User = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """(Admin) Recompute allowed_metrics for every user from their departments.

    This updates the cached ``allowed_metrics`` column so it matches the
    current DEPARTMENT_METRICS mapping.  It is useful after adding new
    metrics to a department for users whose access was granted before those
    metrics existed.
    """
    users = session.exec(select(User)).all()
    updated = 0
    for user in users:
        fresh = get_allowed_metrics_for_departments(user.departments or [])
        current = user.allowed_metrics or []
        if sorted(fresh) != sorted(current):
            user.allowed_metrics = fresh
            session.add(user)
            updated += 1
    session.commit()
    return {"updated": updated, "total": len(users)}

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


def get_visible_departments(user: Optional[User]) -> List[str]:
    """Return the list of departments visible to a given user.

    Admin users (or users with "All" in their departments list) can see all
    departments.  Other users can only see the departments explicitly assigned
    to them.
    """
    if user is None:
        return []
    role = (user.role or "").lower()
    depts = user.departments or []
    if role == "admin" or "All" in depts:
        return list(SUMMARY_DEPARTMENTS)
    # Only return departments that actually exist
    return [d for d in depts if d in SUMMARY_DEPARTMENTS]


def recalculate_metric_month(department: str, metric_name: str, year: int, month: int, session: Session):
    """Recalculates MTD, Outlook, and variances for all daily records of a metric in a given month sequentially."""
    month_start = date(year, month, 1)
    
    # 1. Fetch fixed input for the month
    fixed_stmt = select(KPIRecord).where(
        KPIRecord.department == department,
        KPIRecord.date == month_start,
        KPIRecord.metric_name == metric_name,
        KPIRecord.subtype == 'fixed_input'
    )
    fixed_input = session.exec(fixed_stmt).first()
    
    # 2. Fetch all daily records for the month, sorted by date
    if month == 12:
        next_month_start = date(year + 1, 1, 1)
    else:
        next_month_start = date(year, month + 1, 1)
        
    daily_stmt = select(KPIRecord).where(
        KPIRecord.department == department,
        KPIRecord.date >= month_start,
        KPIRecord.date < next_month_start,
        KPIRecord.metric_name == metric_name,
        or_(KPIRecord.subtype != 'fixed_input', KPIRecord.subtype == None)
    ).order_by(KPIRecord.date)
    daily_records = session.exec(daily_stmt).all()
    
    if not daily_records:
        return
        
    def parse_float(val):
        if val is None:
            return 0.0
        try:
            return float(str(val).replace("%", "").replace(",", "").strip())
        except (ValueError, TypeError):
            return 0.0

    is_ohs_dept = (department == "OHS")

    full_fcst = 0.0
    full_budg = 0.0
    if is_ohs_dept:
        annual_target = 0.0
        if fixed_input and fixed_input.data:
            annual_target = parse_float(fixed_input.data.get('annual_target') or fixed_input.data.get('full_budget'))
        else:
            # Fallback to checking daily records
            for r in daily_records:
                if r.data and ('annual_target' in r.data or 'full_budget' in r.data):
                    annual_target = parse_float(r.data.get('annual_target') or r.data.get('full_budget'))
                    break
            else:
                annual_target = 0.0 if metric_name == "Environmental Incidents" else 24.0
        full_fcst = annual_target / 12.0
        full_budg = annual_target
    else:
        if fixed_input and fixed_input.data:
            full_fcst = parse_float(fixed_input.data.get('full_forecast'))
            full_budg = parse_float(fixed_input.data.get('full_budget'))
        else:
            # Fallback to checking daily records if fixed_input is not in DB
            for r in daily_records:
                if r.data and ('full_forecast' in r.data or 'full_budget' in r.data):
                    full_fcst = parse_float(r.data.get('full_forecast'))
                    full_budg = parse_float(r.data.get('full_budget'))
                    break

    forecast_per_rig = 0.0
    if metric_name == "Grade Control Drilling":
        if fixed_input and fixed_input.data:
            forecast_per_rig = parse_float(fixed_input.data.get('forecast_per_rig'))
        else:
            # Fallback to checking daily records
            for r in daily_records:
                if r.data and 'forecast_per_rig' in r.data:
                    forecast_per_rig = parse_float(r.data.get('forecast_per_rig'))
                    break
        
    total_days = (next_month_start - month_start).days
            
    def calc_var(act, fcst, is_ohs=False, use_act_denom=False):
        if act is None or fcst is None or act == "-" or fcst == "-":
            return "-"
        try:
            act_f = float(str(act).replace("%", "").replace(",", "").strip())
            fcst_f = float(str(fcst).replace("%", "").replace(",", "").strip())
        except (ValueError, TypeError):
            return "-"
            
        if is_ohs:
            # Round both inputs to the nearest whole number first
            act_f = float(round(act_f))
            fcst_f = float(round(fcst_f))
            if use_act_denom:
                if act_f == 0:
                    return "0%"
                var = ((fcst_f - act_f) / act_f) * 100
                return f"{round(var)}%"
            else:
                if fcst_f == 0:
                    return "0%" if act_f == 0 else "-100%"
                var = ((fcst_f - act_f) / fcst_f) * 100
                return f"{round(var)}%"
        else:
            if fcst_f == 0:
                return "0%" if act_f == 0 else "-"
            var = ((act_f - fcst_f) / fcst_f) * 100
            return f"{round(var)}%"
    
    # Running values
    running_fcst = 0.0
    running_act = 0.0
    running_weights = 0.0
    running_weighted_sum = 0.0

    # For Recovery metric, pre-fetch Gold Recovery and Gold Contained daily records
    # so we can compute Recovery MTD Actual = (GR MTD / GC MTD) * 100
    gr_records: list[KPIRecord] = []
    gc_records: list[KPIRecord] = []
    if department == "Milling_CIL" and metric_name in ("Recovery", "Plant Feed Grade"):
        gr_stmt = select(KPIRecord).where(
            KPIRecord.department == department,
            KPIRecord.date >= month_start,
            KPIRecord.date < next_month_start,
            KPIRecord.metric_name == "Gold Recovery",
            or_(KPIRecord.subtype != 'fixed_input', KPIRecord.subtype == None)
        ).order_by(KPIRecord.date)
        gr_records = list(session.exec(gr_stmt).all())

        gc_stmt = select(KPIRecord).where(
            KPIRecord.department == department,
            KPIRecord.date >= month_start,
            KPIRecord.date < next_month_start,
            KPIRecord.metric_name == "Gold Contained",
            or_(KPIRecord.subtype != 'fixed_input', KPIRecord.subtype == None)
        ).order_by(KPIRecord.date)
        gc_records = list(session.exec(gc_stmt).all())
    
    # For Plant Feed Grade MTD Forecast, we need a running accumulator of
    # Gold Contained daily_forecast up to each date.  Pre-compute a
    # date->running_sum map for O(1) lookup inside the loop.
    gc_fcst_by_date: dict[date, float] = {}
    if department == "Milling_CIL" and metric_name == "Plant Feed Grade":
        running_gc = 0.0
        for gc_r in gc_records:
            running_gc += parse_float(gc_r.data.get('daily_forecast'))
            gc_fcst_by_date[gc_r.date] = running_gc

    for idx, r in enumerate(daily_records):
        d = dict(r.data)
        
        # Clear existing computed fields
        COMPUTED_FIELDS = ['var1', 'var2', 'var3', 'daily_var', 'mtd_var', 'budget_var', 'mtd_actual', 'mtd_forecast', 'outlook']
        for field in COMPUTED_FIELDS:
            d.pop(field, None)
            
        # Auto-calculate daily forecast for Grade Control Drilling if not specified
        if metric_name == "Grade Control Drilling":
            is_fcst_empty = d.get('daily_forecast') in (None, 0, 0.0, "", "-")
            if is_fcst_empty:
                rigs = parse_float(d.get('num_rigs') or d.get('qty_available'))
                d['daily_forecast'] = round(rigs * forecast_per_rig, 2)

        # Auto-calculate daily forecast for Toll if not specified
        if metric_name == "Toll":
            is_fcst_empty = d.get('daily_forecast') in (None, 0, 0.0, "", "-")
            if is_fcst_empty:
                d['daily_forecast'] = full_fcst / total_days

        daily_act = parse_float(d.get('daily_actual'))
        daily_fcst = parse_float(d.get('daily_forecast'))
        
        if department == "Mining" and metric_name in ("Near Pit Ore Stockpile", "Near Pit Ore Stockpile Grade"):
            d['daily_forecast'] = 0.0
            daily_fcst = 0.0
            
        current_day = r.date.day
        remaining_days = max(0, total_days - current_day)

        # MTD Forecast
        if is_ohs_dept:
            mtd_forecast = full_fcst
        elif department == "Mining" and metric_name in ("Rehandle Grade", "Near Pit Ore Stockpile", "Near Pit Ore Stockpile Grade"):
            mtd_forecast = daily_fcst
        elif department == "Milling_CIL" and metric_name == "Recovery":
            mtd_forecast = daily_fcst
        elif department == "Milling_CIL" and metric_name == "Plant Feed Grade":
            # MTD Forecast = GC_MTD_Forecast / (accrued daily_forecast_tonnes) * 31.1035
            # GC_MTD_Forecast = sum of Gold Contained daily_forecast up to current date
            daily_fcst_tonnes = parse_float(d.get('daily_forecast_tonnes'))
            running_fcst += daily_fcst_tonnes
            gc_running = gc_fcst_by_date.get(r.date, 0.0)
            if running_fcst != 0 and gc_running != 0:
                mtd_forecast = (gc_running / running_fcst) * 31.1035
            else:
                mtd_forecast = 0.0
        else:
            running_fcst += daily_fcst
            mtd_forecast = running_fcst
        
        # MTD Actual
        if department == "Geology" and metric_name == "Toll":
            if 'wet_tonnes' in d:
                wet_tonnes = parse_float(d['wet_tonnes'])
            else:
                wet_tonnes = round(daily_act * 0.85)
                d['wet_tonnes'] = wet_tonnes
            running_act += wet_tonnes
            mtd_actual = running_act
        elif department == "Mining" and metric_name == "Ore Mined Grade":
            daily_act_grade = parse_float(d.get('daily_act_grade'))
            running_weighted_sum += (daily_act_grade * daily_fcst)
            running_weights += daily_fcst
            mtd_actual = running_weighted_sum / running_weights if running_weights != 0 else 0.0
        elif department == "Mining" and metric_name == "Rehandle Grade":
            daily_act_tonnes = parse_float(d.get('daily_actual'))
            daily_act_grade = parse_float(d.get('daily_act_grade'))
            running_weighted_sum += (daily_act_grade * daily_act_tonnes)
            running_weights += daily_act_tonnes
            mtd_actual = running_weighted_sum / running_weights if running_weights != 0 else 0.0
        elif department == "Mining" and metric_name in ("Near Pit Ore Stockpile", "Main Rompad Stockpile"):
            mtd_actual = daily_act
        elif department == "Mining" and metric_name in ("Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade"):
            mtd_actual = parse_float(d.get('daily_act_grade'))
        elif department == "Milling_CIL" and metric_name == "Plant Feed Grade":
            daily_act_tonnes = parse_float(d.get('daily_act_tonnes'))
            running_weighted_sum += (daily_act * daily_act_tonnes)
            running_weights += daily_act_tonnes
            mtd_actual = running_weighted_sum / running_weights if running_weights != 0 else 0.0
        elif department == "Engineering":
            running_weighted_sum += (daily_act * daily_fcst)
            running_weights += daily_act
            mtd_actual = running_weighted_sum / running_weights if running_weights != 0 else 0.0
        elif department == "Milling_CIL" and metric_name == "Recovery":
            # Recovery MTD Actual = (Gold Recovery MTD Actual / Gold Contained MTD Actual) * 100
            # Look up Gold Recovery and Gold Contained daily records up to this date
            gr_running = sum(parse_float(gr_r.data.get('daily_actual')) for gr_r in gr_records if gr_r.date <= r.date)
            gc_running = sum(parse_float(gc_r.data.get('daily_actual')) for gc_r in gc_records if gc_r.date <= r.date)
            mtd_actual = (gr_running / gc_running) * 100 if gc_running != 0 else 0.0
        else:
            running_act += daily_act
            mtd_actual = running_act
            
        # Outlook
        if department == "Mining" and metric_name in ("Rehandle Grade", "Rehandle"):
            outlook = None
        elif department == "Mining" and metric_name in ("Near Pit Ore Stockpile", "Main Rompad Stockpile"):
            outlook = daily_act
        elif department == "Mining" and metric_name in ("Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade"):
            outlook = parse_float(d.get('daily_act_grade'))
        elif department == "Geology":
            if metric_name == "Toll":
                # Toll Outlook uses daily_actual (Wet Tonnes) cumulative
                mtd_act_wet = sum(parse_float(x.data.get('daily_actual')) for x in daily_records[:idx+1])
                outlook = (mtd_act_wet - mtd_forecast) + full_fcst
            else:
                outlook = (mtd_actual - mtd_forecast) + full_fcst
        elif department == "OHS":
            outlook = mtd_actual + ((full_fcst - mtd_actual) / current_day)
        elif department == "Mining" and metric_name == "Ore Mined":
            outlook = mtd_actual + (full_fcst / total_days) * remaining_days
        elif department == "Mining" and metric_name == "Total Material Mined":
            if remaining_days <= 0:
                outlook = mtd_actual
            else:
                outlook = mtd_actual + (full_fcst - mtd_actual) / remaining_days
        elif department == "Milling_CIL" and metric_name == "Recovery":
            outlook = mtd_actual
        elif department == "Milling_CIL" and metric_name in ["Gold Contained", "Gold Recovery", "Tonnes Treated"]:
            outlook = (mtd_actual / current_day) * total_days if current_day > 0 else 0.0
        elif department == "Crushing" and metric_name == "Ore Crushed":
            outlook = (mtd_actual / current_day) * total_days if current_day > 0 else 0.0
        else:
            outlook = mtd_actual
            
        # Variances
        if department == "Mining" and metric_name in (
            "Availability - Dump Trucks",
            "Utilization - Dump Trucks",
            "Availability - Excavators",
            "Utilization - Excavators",
            "Availability - Tipper Trucks",
            "Utilization - Tipper Trucks",
            "Availability - Drill Rigs",
            "Utilization - Drill Rigs",
        ):
            if d.get('daily_actual') in (None, "", "-") or d.get('daily_forecast') in (None, "", "-"):
                var1 = "-"
            else:
                var1 = f"{round(daily_act - daily_fcst)}%"
            var2 = "-"
            var3 = "-"
        elif department == "Mining" and metric_name in ("Rehandle Grade", "Rehandle", "Near Pit Ore Stockpile", "Near Pit Ore Stockpile Grade"):
            if metric_name in ("Rehandle Grade", "Near Pit Ore Stockpile Grade"):
                daily_act_grade = parse_float(d.get('daily_act_grade'))
                var1 = calc_var(daily_act_grade, daily_fcst, is_ohs_dept, use_act_denom=is_ohs_dept)
                var2 = calc_var(mtd_actual, mtd_forecast, is_ohs_dept, use_act_denom=True)
                var3 = "-"
            else:
                var1 = calc_var(daily_act, daily_fcst, is_ohs_dept, use_act_denom=is_ohs_dept)
                var2 = calc_var(mtd_actual, mtd_forecast, is_ohs_dept, use_act_denom=True)
                var3 = "-"
        elif department == "Milling_CIL":
            # day2/day2_forecast are always the previous day's daily_actual/daily_forecast
            day2 = None
            day2_forecast = None
            if idx > 0:
                prev_r = daily_records[idx - 1]
                # Only use previous day if it's the immediately preceding calendar day
                if (r.date - prev_r.date).days == 1:
                    day2 = parse_optional_float(prev_r.data.get('daily_actual'))
                    day2_forecast = parse_optional_float(prev_r.data.get('daily_forecast'))
            if day2 is not None:
                d['day2'] = day2
                d['day_2'] = day2
            if day2_forecast is not None:
                d['day2_forecast'] = day2_forecast
                d['day_2_forecast'] = day2_forecast
            var1 = calc_var(daily_act, daily_fcst, is_ohs_dept, use_act_denom=is_ohs_dept)
            day2_var = calc_var(day2, day2_forecast, is_ohs_dept, use_act_denom=is_ohs_dept)
            var2 = calc_var(mtd_actual, mtd_forecast, is_ohs_dept, use_act_denom=True)
            if metric_name == "Plant Feed Grade":
                var3 = calc_var(outlook, full_fcst, is_ohs_dept, use_act_denom=True)
            else:
                var3 = calc_var(full_fcst, full_budg, is_ohs_dept)
        else:
            var1 = calc_var(daily_act, daily_fcst, is_ohs_dept, use_act_denom=is_ohs_dept)
            var2 = calc_var(mtd_actual, mtd_forecast, is_ohs_dept, use_act_denom=True)
            if department in ("Geology", "OHS"):
                var3 = calc_var(outlook, full_fcst, is_ohs_dept, use_act_denom=True)
            else:
                var3 = calc_var(full_fcst, full_budg, is_ohs_dept)
            
        d["var1"] = var1
        d["daily_var"] = var1
        d["var2"] = var2
        d["mtd_var"] = var2
        d["var3"] = var3
        d["budget_var"] = var3
        if department == "Milling_CIL":
            d["day2_var"] = day2_var
        if metric_name in ("Rehandle Grade", "Rehandle", "Near Pit Ore Stockpile", "Near Pit Ore Stockpile Grade"):
            d["mtd_actual"] = round(mtd_actual, 2)
            d["mtd_forecast"] = round(mtd_forecast, 2)
        else:
            d["mtd_actual"] = round(mtd_actual, 2) if mtd_actual % 1 else int(mtd_actual)
            d["mtd_forecast"] = round(mtd_forecast, 2) if mtd_forecast % 1 else int(mtd_forecast)
        d["outlook"] = "-" if outlook is None else (round(outlook, 2) if outlook % 1 else int(outlook))
        
        if department == "OHS":
            d["full_forecast"] = "-" if full_fcst is None else (round(full_fcst, 2) if full_fcst % 1 else int(full_fcst))
            d["full_budget"] = "-" if full_budg is None else (round(full_budg, 2) if full_budg % 1 else int(full_budg))
            d["annual_target"] = d["full_budget"]
        elif department == "Mining" and metric_name in ("Rehandle Grade", "Rehandle", "Near Pit Ore Stockpile", "Near Pit Ore Stockpile Grade"):
            d["full_forecast"] = "-"
            d["full_budget"] = "-"
        else:
            if department == "Geology":
                is_fcst_empty = d.get("full_forecast") in (None, 0, 0.0, "", "-")
                is_budg_empty = d.get("full_budget") in (None, 0, 0.0, "", "-")
                if is_fcst_empty:
                    d["full_forecast"] = round(full_fcst, 2) if full_fcst % 1 else int(full_fcst)
                if is_budg_empty:
                    d["full_budget"] = round(full_budg, 2) if full_budg % 1 else int(full_budg)
            elif department == "Milling_CIL" and metric_name == "Plant Feed Grade":
                # Full Forecast must always equal the Daily Forecast grade for the day
                d["full_forecast"] = round(daily_fcst, 2) if daily_fcst % 1 else int(daily_fcst)
                if d.get("full_budget") is None:
                    d["full_budget"] = round(full_budg, 2) if full_budg % 1 else int(full_budg)
            else:
                if d.get("full_forecast") is None:
                    d["full_forecast"] = round(full_fcst, 2) if full_fcst % 1 else int(full_fcst)
                if d.get("full_budget") is None:
                    d["full_budget"] = round(full_budg, 2) if full_budg % 1 else int(full_budg)
            
        if metric_name in ("Runtime", "Throughput"):
            d["mtd_actual"] = "-"
            d["mtd_forecast"] = "-"
            d["outlook"] = "-"
            d["full_forecast"] = "-"
            d["full_budget"] = "-"
            d["var2"] = "-"
            d["mtd_var"] = "-"
            d["var3"] = "-"
            d["budget_var"] = "-"
        elif department == "Mining" and metric_name in (
            "Availability - Dump Trucks",
            "Utilization - Dump Trucks",
            "Availability - Excavators",
            "Utilization - Excavators",
            "Availability - Tipper Trucks",
            "Utilization - Tipper Trucks",
            "Availability - Drill Rigs",
            "Utilization - Drill Rigs",
        ):
            d["mtd_actual"] = "-"
            d["mtd_forecast"] = "-"
            d["outlook"] = "-"
            d["full_forecast"] = "-"
            d["full_budget"] = "-"
            d["var2"] = "-"
            d["mtd_var"] = "-"
            d["var3"] = "-"
            d["budget_var"] = "-"
            if d.get("daily_actual") is not None and d.get("daily_actual") != "-":
                d["daily_actual"] = f"{round(parse_float(d.get('daily_actual')))}%"
            if d.get("daily_forecast") is not None and d.get("daily_forecast") != "-":
                d["daily_forecast"] = f"{round(parse_float(d.get('daily_forecast')))}%"

        r.data = d
        session.add(r)

@app.get("/api/summary-dashboard")
def get_summary_dashboard(
    target_date: date = Query(..., description="The date to show the summary for"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Aggregate latest KPI data across all departments for the given date, calculating values in realtime from daily records."""
    # Summary Dashboard shows ALL departments to every authenticated user,
    # regardless of their access level (Admin vs Staff).
    month_start = date(target_date.year, target_date.month, 1)
    trend_start = target_date - timedelta(days=6)
    query_start = min(month_start, trend_start)

    all_records = session.exec(
        select(KPIRecord).where(
            KPIRecord.date >= query_start,
            KPIRecord.date <= target_date,
            KPIRecord.department.in_(SUMMARY_DEPARTMENTS)
        )
    ).all()

    def parse_float(val):
        if val is None or val == "" or val == "-":
            return 0.0
        try:
            return float(str(val).replace("%", "").replace(",", "").strip())
        except (ValueError, TypeError):
            return 0.0

    def calc_var(act, fcst, is_ohs=False, use_act_denom=False):
        if act is None or fcst is None or act == "-" or fcst == "-":
            return "-"
        try:
            act_f = float(str(act).replace("%", "").replace(",", "").strip())
            fcst_f = float(str(fcst).replace("%", "").replace(",", "").strip())
        except (ValueError, TypeError):
            return "-"
            
        if is_ohs:
            # Round both inputs to the nearest whole number first
            act_f = float(round(act_f))
            fcst_f = float(round(fcst_f))
            if use_act_denom:
                if act_f == 0:
                    return "0%"
                var = ((fcst_f - act_f) / act_f) * 100
                return f"{round(var)}%"
            else:
                if fcst_f == 0:
                    return "0%" if act_f == 0 else "-100%"
                var = ((fcst_f - act_f) / fcst_f) * 100
                return f"{round(var)}%"
        else:
            if fcst_f == 0:
                return "0%" if act_f == 0 else "-"
            var = ((act_f - fcst_f) / fcst_f) * 100
            return f"{round(var)}%"

    if target_date.month == 12:
        next_month_start = date(target_date.year + 1, 1, 1)
    else:
        next_month_start = date(target_date.year, target_date.month + 1, 1)
    total_days = (next_month_start - month_start).days
    current_day = target_date.day
    remaining_days = max(0, total_days - current_day)

    result = {}
    for dept in SUMMARY_DEPARTMENTS:
        dept_records = [r for r in all_records if r.department == dept]
        
        # Get the list of metrics for this department
        metrics = DEPARTMENT_METRICS.get(dept, [])
        # Exclude "Fixed Inputs" row from summary
        metrics = [m for m in metrics if m != "Fixed Inputs"]

        metrics_data = []
        for metric_name in metrics:
            is_ohs_dept = (dept == "OHS")
            # Get fixed input for this month
            fixed_input = next((r for r in dept_records if r.metric_name == metric_name and r.subtype == 'fixed_input' and r.date == month_start), None)
            full_fcst = 0.0
            full_budg = 0.0
            if is_ohs_dept:
                annual_target = 0.0
                if fixed_input and fixed_input.data:
                    annual_target = parse_float(fixed_input.data.get('annual_target') or fixed_input.data.get('full_budget'))
                else:
                    annual_target = 0.0 if metric_name == "Environmental Incidents" else 24.0
                full_fcst = annual_target / 12.0
                full_budg = annual_target
            else:
                if fixed_input and fixed_input.data:
                    full_fcst = parse_float(fixed_input.data.get('full_forecast'))
                    full_budg = parse_float(fixed_input.data.get('full_budget'))

            # Get daily records for this month up to target_date
            daily_records = [r for r in dept_records if r.metric_name == metric_name and r.subtype != 'fixed_input' and r.date >= month_start and r.date <= target_date]
            daily_records.sort(key=lambda x: x.date)

            # Target record for target_date
            target_rec = next((r for r in daily_records if r.date == target_date), None)
            
            # If there are no daily records for this month up to target_date, skip
            if not daily_records and not target_rec:
                continue

            # Parse daily values
            if target_rec:
                if metric_name in ("Ore Mined Grade", "Rehandle Grade", "Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade"):
                    daily_actual = target_rec.data.get('daily_act_grade')
                else:
                    daily_actual = target_rec.data.get('daily_actual')
                daily_forecast = target_rec.data.get('daily_forecast')
                qty_available = target_rec.data.get('qty_available')
                day2 = parse_optional_float(target_rec.data.get('day2')) if 'day2' in target_rec.data else parse_optional_float(target_rec.data.get('day_2'))
                day2_forecast = parse_optional_float(target_rec.data.get('day2_forecast')) if 'day2_forecast' in target_rec.data else parse_optional_float(target_rec.data.get('day_2_forecast'))
            else:
                daily_actual = None
                daily_forecast = None
                qty_available = None
                day2 = None
                day2_forecast = None

            # For Milling_CIL: day2/day2_forecast are always the previous day's daily_actual/daily_forecast
            if dept == "Milling_CIL":
                prev_date = target_date - timedelta(days=1)
                prev_rec = next((r for r in dept_records if r.metric_name == metric_name and r.subtype != 'fixed_input' and r.date == prev_date), None)
                if prev_rec and prev_rec.data:
                    day2 = parse_optional_float(prev_rec.data.get('daily_actual'))
                    day2_forecast = parse_optional_float(prev_rec.data.get('daily_forecast'))
                else:
                    day2 = None
                    day2_forecast = None


            if dept == "Mining" and metric_name in ("Near Pit Ore Stockpile", "Main Rompad Stockpile", "Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade"):
                daily_forecast = 0.0

            # Calculate MTD Forecast
            if is_ohs_dept:
                mtd_forecast = full_fcst
            elif dept == "Mining" and metric_name in ("Rehandle Grade", "Near Pit Ore Stockpile", "Main Rompad Stockpile", "Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade"):
                mtd_forecast = parse_optional_float(target_rec.data.get('daily_forecast')) if (target_rec and target_rec.data.get('daily_forecast') is not None) else None
            elif dept == "Milling_CIL" and metric_name == "Recovery":
                mtd_forecast = parse_optional_float(daily_forecast) if daily_forecast is not None else None
            elif dept == "Milling_CIL" and metric_name == "Plant Feed Grade":
                # MTD Forecast = GC_MTD_Forecast / (accrued daily_forecast_tonnes) * 31.1035
                gc_daily = [r for r in dept_records if r.metric_name == "Gold Contained" and r.subtype != 'fixed_input' and r.date >= month_start and r.date <= target_date]
                gc_mtd_fcst = sum_or_none(parse_optional_float(r.data.get('daily_forecast')) for r in gc_daily)
                pfg_fcst_tonnes = sum_or_none(parse_optional_float(r.data.get('daily_forecast_tonnes')) for r in daily_records)
                if gc_mtd_fcst and pfg_fcst_tonnes and pfg_fcst_tonnes != 0:
                    mtd_forecast = (gc_mtd_fcst / pfg_fcst_tonnes) * 31.1035
                else:
                    mtd_forecast = None
            else:
                mtd_forecast = sum_or_none(parse_optional_float(r.data.get('daily_forecast')) for r in daily_records)

            # Calculate MTD Actual
            if dept == "Geology" and metric_name == "Toll":
                def get_dry_tonnes(r):
                    if 'wet_tonnes' in r.data:
                        return parse_optional_float(r.data['wet_tonnes'])
                    da = parse_optional_float(r.data.get('daily_actual'))
                    return round(da * 0.85) if da is not None else None
                mtd_actual = sum_or_none(get_dry_tonnes(r) for r in daily_records)
            elif dept == "Mining" and metric_name == "Ore Mined Grade":
                sum_prod = sum_or_none(parse_float(r.data.get('daily_act_grade')) * parse_float(r.data.get('daily_forecast')) for r in daily_records)
                sum_weights = sum_or_none(parse_optional_float(r.data.get('daily_forecast')) for r in daily_records)
                mtd_actual = sum_prod / sum_weights if (sum_weights and sum_weights != 0) else None
            elif dept == "Mining" and metric_name == "Rehandle Grade":
                sum_prod = sum_or_none(parse_float(r.data.get('daily_act_grade')) * parse_float(r.data.get('daily_actual')) for r in daily_records)
                sum_weights = sum_or_none(parse_optional_float(r.data.get('daily_actual')) for r in daily_records)
                mtd_actual = sum_prod / sum_weights if (sum_weights and sum_weights != 0) else None
            elif dept == "Mining" and metric_name in ("Near Pit Ore Stockpile", "Main Rompad Stockpile"):
                mtd_actual = parse_optional_float(daily_actual)
            elif dept == "Mining" and metric_name in ("Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade"):
                mtd_actual = parse_optional_float(target_rec.data.get('daily_act_grade')) if target_rec else None
            elif dept == "Milling_CIL" and metric_name == "Plant Feed Grade":
                sum_prod = sum_or_none(parse_float(r.data.get('daily_actual')) * parse_float(r.data.get('daily_act_tonnes')) for r in daily_records)
                sum_weights = sum_or_none(parse_optional_float(r.data.get('daily_act_tonnes')) for r in daily_records)
                mtd_actual = sum_prod / sum_weights if (sum_weights and sum_weights != 0) else None
            elif dept == "Engineering":
                sum_prod = sum_or_none(parse_float(r.data.get('daily_actual')) * parse_float(r.data.get('daily_forecast')) for r in daily_records)
                sum_weights = sum_or_none(parse_optional_float(r.data.get('daily_actual')) for r in daily_records)
                mtd_actual = sum_prod / sum_weights if (sum_weights and sum_weights != 0) else None
            elif dept == "Milling_CIL" and metric_name == "Recovery":
                # Recovery MTD Actual = (Gold Recovery MTD Actual / Gold Contained MTD Actual) * 100
                gr_daily = [r for r in dept_records if r.metric_name == "Gold Recovery" and r.subtype != 'fixed_input' and r.date >= month_start and r.date <= target_date]
                gc_daily = [r for r in dept_records if r.metric_name == "Gold Contained" and r.subtype != 'fixed_input' and r.date >= month_start and r.date <= target_date]
                gr_mtd = sum_or_none(parse_optional_float(r.data.get('daily_actual')) for r in gr_daily)
                gc_mtd = sum_or_none(parse_optional_float(r.data.get('daily_actual')) for r in gc_daily)
                mtd_actual = (gr_mtd / gc_mtd) * 100 if (gr_mtd is not None and gc_mtd is not None and gc_mtd != 0) else None
            else:
                mtd_actual = sum_or_none(parse_optional_float(r.data.get('daily_actual')) for r in daily_records)

            # Calculate Outlook
            if dept == "Mining" and metric_name in ("Rehandle Grade", "Rehandle"):
                outlook = None
            elif dept == "Mining" and metric_name in ("Near Pit Ore Stockpile", "Main Rompad Stockpile"):
                outlook = parse_optional_float(daily_actual)
            elif dept == "Mining" and metric_name in ("Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade"):
                outlook = parse_optional_float(target_rec.data.get('daily_act_grade')) if target_rec else None
            elif dept == "Geology":
                if metric_name == "Toll":
                    mtd_act_wet = sum_or_none(parse_optional_float(r.data.get('daily_actual')) for r in daily_records)
                    outlook = (mtd_act_wet - mtd_forecast) + full_fcst if (mtd_act_wet is not None and mtd_forecast is not None) else None
                else:
                    outlook = (mtd_actual - mtd_forecast) + full_fcst if (mtd_actual is not None and mtd_forecast is not None) else None
            elif dept == "OHS":
                outlook = mtd_actual + ((full_fcst - mtd_actual) / current_day) if mtd_actual is not None else None
            elif dept == "Mining" and metric_name == "Ore Mined":
                outlook = mtd_actual + (full_fcst / total_days) * remaining_days if mtd_actual is not None else None
            elif dept == "Mining" and metric_name == "Total Material Mined":
                if remaining_days <= 0:
                    outlook = mtd_actual
                else:
                    outlook = mtd_actual + (full_fcst - mtd_actual) / remaining_days if (mtd_actual is not None) else None
            elif dept == "Milling_CIL" and metric_name == "Recovery":
                outlook = mtd_actual
            elif dept == "Milling_CIL" and metric_name in ["Gold Contained", "Gold Recovery", "Tonnes Treated"]:
                outlook = (mtd_actual / current_day) * total_days if (mtd_actual is not None and current_day > 0) else None
            elif dept == "Crushing" and metric_name == "Ore Crushed":
                outlook = (mtd_actual / current_day) * total_days if (mtd_actual is not None and current_day > 0) else None
            else:
                outlook = mtd_actual

            # Variances
            day2_var = "-"
            if daily_actual is None:
                var1 = "-"
                var2 = "-"
                var3 = "-"
            elif dept == "Mining" and metric_name in (
                "Availability - Dump Trucks",
                "Utilization - Dump Trucks",
                "Availability - Excavators",
                "Utilization - Excavators",
                "Availability - Tipper Trucks",
                "Utilization - Tipper Trucks",
                "Availability - Drill Rigs",
                "Utilization - Drill Rigs",
            ):
                if target_rec is None or target_rec.data.get('daily_actual') in (None, "", "-") or target_rec.data.get('daily_forecast') in (None, "", "-"):
                    var1 = "-"
                else:
                    var1 = f"{round(parse_float(daily_actual) - parse_float(daily_forecast))}%"
                var2 = "-"
                var3 = "-"
            elif dept == "Mining" and metric_name in ("Rehandle Grade", "Rehandle", "Near Pit Ore Stockpile", "Main Rompad Stockpile", "Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade"):
                if metric_name in ("Rehandle Grade", "Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade"):
                    daily_act_grade = parse_float(target_rec.data.get('daily_act_grade')) if target_rec else 0.0
                    var1 = calc_var(daily_act_grade, parse_float(daily_forecast), is_ohs_dept, use_act_denom=is_ohs_dept)
                    var2 = calc_var(mtd_actual, mtd_forecast, is_ohs_dept, use_act_denom=True)
                    var3 = "-"
                else:
                    var1 = calc_var(parse_float(daily_actual), parse_float(daily_forecast), is_ohs_dept, use_act_denom=is_ohs_dept)
                    var2 = calc_var(mtd_actual, mtd_forecast, is_ohs_dept, use_act_denom=True)
                    var3 = "-"
            elif dept == "Milling_CIL":
                var1 = calc_var(parse_float(daily_actual), parse_float(daily_forecast), is_ohs_dept, use_act_denom=is_ohs_dept)
                day2_var = calc_var(day2, day2_forecast, is_ohs_dept, use_act_denom=is_ohs_dept)
                var2 = calc_var(mtd_actual, mtd_forecast, is_ohs_dept, use_act_denom=True)
                if metric_name == "Plant Feed Grade":
                    var3 = calc_var(outlook, full_fcst, is_ohs_dept, use_act_denom=True)
                else:
                    var3 = calc_var(full_fcst, full_budg, is_ohs_dept)
            else:
                var1 = calc_var(parse_float(daily_actual), parse_float(daily_forecast), is_ohs_dept, use_act_denom=is_ohs_dept)
                var2 = calc_var(mtd_actual, mtd_forecast, is_ohs_dept, use_act_denom=True)
                if dept in ("Geology", "OHS"):
                    var3 = calc_var(outlook, full_fcst, is_ohs_dept, use_act_denom=True)
                else:
                    var3 = calc_var(full_fcst, full_budg, is_ohs_dept)

            if metric_name in ("Runtime", "Throughput") or dept == "Engineering":
                data = {
                    "daily_actual": daily_actual,
                    "daily_forecast": daily_forecast if daily_actual is not None else None,
                    "var1": var1,
                    "daily_var": var1,
                    "mtd_actual": "-",
                    "mtd_forecast": "-",
                    "var2": "-",
                    "mtd_var": "-",
                    "outlook": "-",
                    "full_forecast": "-",
                    "full_budget": "-",
                    "var3": "-",
                    "budget_var": "-",
                }
            elif dept == "Mining" and metric_name in (
                "Availability - Dump Trucks",
                "Utilization - Dump Trucks",
                "Availability - Excavators",
                "Utilization - Excavators",
                "Availability - Tipper Trucks",
                "Utilization - Tipper Trucks",
                "Availability - Drill Rigs",
                "Utilization - Drill Rigs",
            ):
                daily_act_clean = parse_float(daily_actual)
                daily_fcst_clean = parse_float(daily_forecast)
                data = {
                    "daily_actual": f"{round(daily_act_clean)}%" if daily_actual not in (None, "", "-") else None,
                    "daily_forecast": f"{round(daily_fcst_clean)}%" if (daily_forecast not in (None, "", "-") and daily_actual is not None) else None,
                    "var1": var1,
                    "daily_var": var1,
                    "mtd_actual": "-",
                    "mtd_forecast": "-",
                    "var2": "-",
                    "mtd_var": "-",
                    "outlook": "-",
                    "full_forecast": "-",
                    "full_budget": "-",
                    "var3": "-",
                    "budget_var": "-",
                }
            else:
                data = {
                    "daily_actual": daily_actual,
                    "daily_forecast": daily_forecast if daily_actual is not None else None,
                    "var1": var1,
                    "daily_var": var1,
                    "mtd_actual": (round(mtd_actual, 2) if (mtd_actual % 1 or metric_name in ("Rehandle Grade", "Rehandle", "Stock Pile Pit", "Main Rompad Stockpile", "Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade")) else int(mtd_actual)) if (mtd_actual is not None and daily_actual is not None) else "-",
                    "mtd_forecast": (round(mtd_forecast, 2) if (mtd_forecast % 1 or metric_name in ("Rehandle Grade", "Rehandle", "Stock Pile Pit", "Main Rompad Stockpile", "Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade")) else int(mtd_forecast)) if (mtd_forecast is not None and daily_actual is not None) else "-",
                    "var2": var2,
                    "mtd_var": var2,
                    "outlook": "-" if (outlook is None or daily_actual is None) else (round(outlook, 2) if outlook % 1 else int(outlook)),
                    "full_forecast": "-" if (full_fcst is None or metric_name in ("Rehandle Grade", "Rehandle", "Stock Pile Pit", "Main Rompad Stockpile", "Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade")) else (round(full_fcst, 2) if full_fcst % 1 else int(full_fcst)),
                    "full_budget": "-" if (full_budg is None or metric_name in ("Rehandle Grade", "Rehandle", "Stock Pile Pit", "Main Rompad Stockpile", "Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade")) else (round(full_budg, 2) if full_budg % 1 else int(full_budg)),
                    "var3": var3,
                    "budget_var": var3,
                }

            if is_ohs_dept:
                data["annual_target"] = data["full_budget"]

            if qty_available is not None:
                data["qty_available"] = qty_available
            if day2 is not None:
                data["day_2"] = day2
                data["day2"] = day2
            if day2_forecast is not None:
                data["day_2_forecast"] = day2_forecast
                data["day2_forecast"] = day2_forecast
            if dept == "Milling_CIL":
                data["day2_var"] = day2_var
            if target_rec and 'wet_tonnes' in target_rec.data:
                data["wet_tonnes"] = target_rec.data["wet_tonnes"]
            if target_rec and 'daily_act_grade' in target_rec.data:
                data["daily_act_grade"] = target_rec.data["daily_act_grade"]
            if target_rec and 'daily_act_tonnes' in target_rec.data:
                data["daily_act_tonnes"] = target_rec.data["daily_act_tonnes"]
            # Aggregate comments from any daily record for the target date.
            # This handles legacy duplicate rows where the comment may live on a
            # different row than the one selected as target_rec.
            target_day_comment = next(
                (r.data["comment"] for r in daily_records
                 if r.date == target_date and r.data.get("comment")),
                None
            )
            if target_day_comment:
                data["comment"] = target_day_comment

            # Build 7-day trend of daily_actual
            trend = []
            for d in range(7):
                check_d = trend_start + timedelta(days=d)
                match = next((r for r in dept_records if r.metric_name == metric_name and r.subtype != 'fixed_input' and r.date == check_d), None)
                if match:
                    if metric_name in ("Ore Mined Grade", "Rehandle Grade", "Near Pit Ore Stockpile Grade", "Main Rompad Ore Stockpile Grade"):
                        raw = match.data.get("daily_act_grade")
                    else:
                        raw = match.data.get("daily_actual")
                    try:
                        cleaned = str(raw).replace("%", "").replace(",", "").strip() if raw is not None else None
                        trend.append(float(cleaned) if cleaned else None)
                    except (ValueError, TypeError):
                        trend.append(None)
                else:
                    trend.append(None)

            metrics_data.append({
                "metric_name": metric_name,
                "data": data,
                "trend": trend,
            })

        result[dept] = metrics_data

    return {"date": target_date.isoformat(), "departments": result}

@app.get("/api/kpi/{department}", response_model=List[KPIRecordResponse])
def get_kpi_records(
    department: str, 
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    visible_departments = get_visible_departments(current_user)
    if department not in visible_departments:
        raise HTTPException(status_code=403, detail="Not authorized to view this department")
    query = select(KPIRecord).where(KPIRecord.department == department)
    if start_date:
        query = query.where(KPIRecord.date >= start_date)
    if end_date:
        query = query.where(KPIRecord.date <= end_date)
    records = session.exec(query).all()

    # Collect unique user IDs and build a lookup map
    user_ids = set()
    for r in records:
        if r.created_by_user_id is not None:
            user_ids.add(r.created_by_user_id)
        mod = r.last_modification
        if mod and mod.get("by_user_id"):
            user_ids.add(mod["by_user_id"])

    username_map = {}
    full_name_map = {}
    if user_ids:
        users = session.exec(select(User).where(User.id.in_(list(user_ids)))).all()
        username_map = {u.id: u.username for u in users}
        full_name_map = {u.id: u.full_name for u in users}

    # Build response with created_by_username and created_by_full_name populated
    result = []
    for r in records:
        uid = r.created_by_user_id
        result.append(KPIRecordResponse(
            id=r.id,
            department=r.department,
            subtype=r.subtype,
            date=r.date,
            metric_name=r.metric_name,
            data=r.data,
            created_by_user_id=uid,
            created_by_username=username_map.get(uid) if uid else None,
            created_by_full_name=full_name_map.get(uid) if uid else None,
            created_at=r.created_at,
            last_modification=r.last_modification,
        ))
    return result


def _find_existing_record_for_upsert(session: Session, department: str, record: KPIRecord) -> Optional[KPIRecord]:
    """Return the existing record that should be updated by an upsert.

    Fixed-input records are matched exactly. Daily records are matched by
    ``subtype == 'daily_input'`` *or* ``subtype IS NULL`` so that legacy rows
    created before the subtype column was populated are updated rather than
    duplicated.
    """
    stmt = select(KPIRecord).where(
        KPIRecord.department == department,
        KPIRecord.date == record.date,
        KPIRecord.metric_name == record.metric_name,
    )
    if record.subtype == 'fixed_input':
        stmt = stmt.where(KPIRecord.subtype == 'fixed_input')
    else:
        stmt = stmt.where(or_(KPIRecord.subtype == 'daily_input', KPIRecord.subtype.is_(None)))
    return session.exec(stmt).first()


def _validate_previous_day_submitted(session: Session, department: str, metric_name: str, record_date: date) -> Optional[str]:
    """Validate that the previous day has a daily record for the same department+metric.

    Returns an error message string if validation fails, or ``None`` if it passes.
    Skips validation when no prior daily records exist at all for this
    department+metric (i.e. the very first entry is always allowed).
    """
    previous_day = record_date - timedelta(days=1)

    # Check if any daily record exists for this department+metric before record_date.
    # If none exist, this is the first entry — allow it.
    any_prior = session.exec(
        select(KPIRecord).where(
            KPIRecord.department == department,
            KPIRecord.metric_name == metric_name,
            KPIRecord.date < record_date,
            or_(KPIRecord.subtype == 'daily_input', KPIRecord.subtype.is_(None)),
        )
    ).first()

    if any_prior is None:
        return None  # First-ever entry for this metric — allowed

    # Now check if the immediate previous day has a record
    prev_day_record = session.exec(
        select(KPIRecord).where(
            KPIRecord.department == department,
            KPIRecord.metric_name == metric_name,
            KPIRecord.date == previous_day,
            or_(KPIRecord.subtype == 'daily_input', KPIRecord.subtype.is_(None)),
        )
    ).first()

    if prev_day_record is None:
        return (
            f"Previous day ({previous_day.isoformat()}) has no entry for '{metric_name}'. "
            "Please submit the previous day's data before entering the current day."
        )

    return None


def _deduplicate_daily_records(session: Session, department: str, record_date: date, metric_name: str, keep_id: int) -> None:
    """Remove duplicate daily rows for the same department/date/metric.

    This cleans up legacy duplicate rows that were created when the upsert
    logic did not treat ``NULL`` and ``'daily_input'`` as equivalent.
    """
    dupes = session.exec(
        select(KPIRecord).where(
            KPIRecord.department == department,
            KPIRecord.date == record_date,
            KPIRecord.metric_name == metric_name,
            KPIRecord.id != keep_id,
            or_(KPIRecord.subtype == 'daily_input', KPIRecord.subtype.is_(None)),
        )
    ).all()
    for d in dupes:
        session.delete(d)
    if dupes:
        session.commit()


@app.post("/api/kpi/{department}", response_model=KPIRecord)
def create_kpi_record(department: str, record: KPIRecord, session: Session = Depends(get_session), _user: User = Depends(get_current_active_user)):
    if (_user.role or "").lower() != "admin":
        allowed = get_current_allowed_metrics(_user)
        if record.metric_name != "Fixed Inputs" and record.metric_name not in allowed:
            raise HTTPException(status_code=403, detail="Not authorized to modify this metric")

    try:
        # 1. Force date conversion if it's a string (fixes SQLite error)
        if isinstance(record.date, str):
            record.date = datetime.strptime(record.date, "%Y-%m-%d").date()

        # 2. Validate previous-day submission for daily records
        if record.subtype != 'fixed_input':
            prev_day_error = _validate_previous_day_submitted(
                session, department, record.metric_name, record.date
            )
            if prev_day_error:
                raise HTTPException(status_code=400, detail=prev_day_error)

        # Check for existing record to prevent duplicates (Upsert logic).
        # Daily records created before the subtype column was fully populated
        # have subtype=NULL, so treat NULL and 'daily_input' as equivalent.
        existing = _find_existing_record_for_upsert(session, department, record)

        if existing:
            # Update existing
            existing.data = record.data
            existing.last_modification = {
                "at": datetime.now(timezone.utc).isoformat(),
                "by_user_id": _user.id,
                "username": _user.username
            }
            # Normalize subtype so legacy NULL-subtype daily rows become 'daily_input'
            existing.subtype = record.subtype
            session.add(existing)
            session.commit()
            session.refresh(existing)

            # Remove duplicate daily rows created by the old upsert logic
            if record.subtype != 'fixed_input':
                _deduplicate_daily_records(session, department, record.date, record.metric_name, existing.id)
            
            # Recalculate metric month
            rec_date = existing.date
            if isinstance(rec_date, str):
                rec_date = datetime.strptime(rec_date, "%Y-%m-%d").date()
            if existing.metric_name != "Fixed Inputs":
                recalculate_metric_month(department, existing.metric_name, rec_date.year, rec_date.month, session)
                # If Gold Recovery or Gold Contained changed, also recalculate Recovery
                if department == "Milling_CIL" and existing.metric_name in ("Gold Recovery", "Gold Contained"):
                    recalculate_metric_month(department, "Recovery", rec_date.year, rec_date.month, session)
                session.commit()
                session.refresh(existing)
                
            return existing
        else:
            # Create new
            record.department = department
            record.created_by_user_id = _user.id
            record.created_at = datetime.now(timezone.utc)
            session.add(record)
            session.commit()
            session.refresh(record)
            
            # Recalculate metric month
            rec_date = record.date
            if isinstance(rec_date, str):
                rec_date = datetime.strptime(rec_date, "%Y-%m-%d").date()
            if record.metric_name != "Fixed Inputs":
                recalculate_metric_month(department, record.metric_name, rec_date.year, rec_date.month, session)
                # If Gold Recovery or Gold Contained changed, also recalculate Recovery
                if department == "Milling_CIL" and record.metric_name in ("Gold Recovery", "Gold Contained"):
                    recalculate_metric_month(department, "Recovery", rec_date.year, rec_date.month, session)
                session.commit()
                session.refresh(record)
                
            return record
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("ERROR creating KPI record")
        raise HTTPException(status_code=500, detail="An internal server error occurred. Please contact support.")

@app.post("/api/kpi/{department}/import")
def import_kpi_records(
    department: str, 
    records: List[KPIImportRecord], 
    session: Session = Depends(get_session), 
    _user: User = Depends(get_current_active_user)
):
    if (_user.role or "").lower() != "admin":
        # Check if user is allowed for ALL metrics in the import
        allowed = set(get_current_allowed_metrics(_user))
        for r in records:
            if r.metric_name != "Fixed Inputs" and r.metric_name not in allowed:
                raise HTTPException(status_code=403, detail=f"Not authorized to modify metric: {r.metric_name}")

    count = 0
    errors = []
    mutated_keys = set()

    # Pre-validate: ensure previous-day records exist for daily imports.
    # Build a set of (metric_name, date) present in this import batch
    # so that records within the same batch can satisfy each other.
    batch_dates: Dict[str, set] = {}
    for rec in records:
        if rec.subtype != 'fixed_input':
            batch_dates.setdefault(rec.metric_name, set()).add(rec.date)

    for i, rec in enumerate(records):
        try:
            # Validate previous-day submission for daily records.
            # Check against DB *and* records already seen in this batch.
            if rec.subtype != 'fixed_input':
                rec_date = rec.date
                if isinstance(rec_date, str):
                    rec_date = datetime.strptime(rec_date, "%Y-%m-%d").date()
                prev_day = rec_date - timedelta(days=1)
                # Check DB for any prior record at all
                any_prior_db = session.exec(
                    select(KPIRecord).where(
                        KPIRecord.department == department,
                        KPIRecord.metric_name == rec.metric_name,
                        KPIRecord.date < rec_date,
                        or_(KPIRecord.subtype == 'daily_input', KPIRecord.subtype.is_(None)),
                    )
                ).first()
                prev_in_batch = prev_day in batch_dates.get(rec.metric_name, set())
                prev_in_db = any_prior_db is not None and session.exec(
                    select(KPIRecord).where(
                        KPIRecord.department == department,
                        KPIRecord.metric_name == rec.metric_name,
                        KPIRecord.date == prev_day,
                        or_(KPIRecord.subtype == 'daily_input', KPIRecord.subtype.is_(None)),
                    )
                ).first() is not None

                if any_prior_db is not None and not prev_in_db and not prev_in_batch:
                    errors.append(
                        f"Row {i+1}: Previous day ({prev_day.isoformat()}) has no entry for "
                        f"'{rec.metric_name}'. Please include the previous day's data in the import."
                    )
                    continue

            # Upsert logic. Treat NULL subtype and 'daily_input' as equivalent
            # for daily records so legacy rows are updated, not duplicated.
            existing = _find_existing_record_for_upsert(session, department, rec)

            # Track mutated key
            rec_date = rec.date
            if isinstance(rec_date, str):
                rec_date = datetime.strptime(rec_date, "%Y-%m-%d").date()
            if rec.metric_name != "Fixed Inputs":
                mutated_keys.add((rec.metric_name, rec_date.year, rec_date.month))
            
            if existing:
                existing.data = rec.data
                existing.subtype = rec.subtype
                existing.last_modification = {
                    "at": datetime.now(timezone.utc).isoformat(),
                    "by_user_id": _user.id,
                    "username": _user.username
                }
                session.add(existing)
            else:
                db_record = KPIRecord(
                    department=department,
                    date=rec.date,
                    metric_name=rec.metric_name,
                    subtype=rec.subtype,
                    data=rec.data,
                    created_by_user_id=_user.id,
                    created_at=datetime.now(timezone.utc)
                )
                session.add(db_record)
            count += 1
        except Exception as e:
            errors.append(f"Row {i+1}: {str(e)}")

    session.commit()
    
    # Recalculate mutated metric months
    recovery_months = set()
    for m_name, y, m in mutated_keys:
        try:
            recalculate_metric_month(department, m_name, y, m, session)
            if department == "Milling_CIL" and m_name in ("Gold Recovery", "Gold Contained"):
                recovery_months.add((y, m))
        except Exception as e:
            print(f"Error recalculating imported metric {m_name} in {y}-{m}: {e}")

    # Recalculate Recovery for any months where Gold Recovery or Gold Contained changed
    for y, m in recovery_months:
        try:
            recalculate_metric_month(department, "Recovery", y, m, session)
        except Exception as e:
            print(f"Error recalculating Recovery after import in {y}-{m}: {e}")
            
    if mutated_keys:
        session.commit()
        
    return {"status": "success", "imported_count": count, "errors": errors}

@app.get("/api/kpi/{department}/previous-mtd")
def get_previous_mtd(
    department: str, 
    metric: str, 
    current_date: date, 
    subtype: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    visible_departments = get_visible_departments(current_user)
    if department not in visible_departments:
        raise HTTPException(status_code=403, detail="Not authorized to view this department")
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
    
    # Store key info before deleting
    dept = record.department
    metric_name = record.metric_name
    rec_date = record.date
    if isinstance(rec_date, str):
        rec_date = datetime.strptime(rec_date, "%Y-%m-%d").date()
        
    session.delete(record)
    session.commit()
    
    # Recalculate remaining records for this month
    if metric_name != "Fixed Inputs":
        try:
            recalculate_metric_month(dept, metric_name, rec_date.year, rec_date.month, session)
            # If Gold Recovery or Gold Contained deleted, also recalculate Recovery
            if dept == "Milling_CIL" and metric_name in ("Gold Recovery", "Gold Contained"):
                recalculate_metric_month(dept, "Recovery", rec_date.year, rec_date.month, session)
            session.commit()
        except Exception as e:
            print(f"Error recalculating metric month after deletion: {e}")
            
    return {"ok": True}

@app.post("/api/kpi/{department}/cascade-fixed")
def cascade_fixed_input(
    department: str,
    payload: CascadeFixedRequest,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_active_user),
):
    if (_user.role or "").lower() != "admin":
        allowed = get_current_allowed_metrics(_user)
        if payload.metric_name not in allowed:
            raise HTTPException(status_code=403, detail="Not authorized to modify this metric")

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
            if department == "OHS":
                annual_target = payload.annual_target if payload.annual_target is not None else payload.full_budget
                new_data['annual_target'] = annual_target
                new_data['full_budget'] = annual_target
                new_data['full_forecast'] = annual_target / 12.0
                new_data['mtd_forecast'] = annual_target / 12.0
            elif department == "Milling_CIL" and payload.metric_name == "Plant Feed Grade":
                # Full Forecast must always equal the Daily Forecast grade for the day
                daily_fcst = new_data.get('daily_forecast')
                new_data['full_forecast'] = daily_fcst if daily_fcst not in (None, '', '-') else payload.full_forecast
                new_data['full_budget'] = payload.full_budget
            else:
                new_data['full_forecast'] = payload.full_forecast
                new_data['full_budget'] = payload.full_budget
            
            # Helper for variance
            def calc_var(act_val, fcst_val, is_ohs=False, use_act_denom=False):
                try:
                    act = float(act_val)
                    fcst = float(fcst_val)
                    
                    if is_ohs:
                        # Round both inputs to the nearest whole number first
                        act = float(round(act))
                        fcst = float(round(fcst))
                        if use_act_denom:
                            if act == 0:
                                return "0%"
                            var = ((fcst - act) / act) * 100
                            return f"{round(var)}%"
                        else:
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
            if payload.metric_name == "Grade Control Drilling" and payload.forecast_per_rig is not None:
                new_data['forecast_per_rig'] = payload.forecast_per_rig
                # Update daily forecast based on rigs count * forecast_per_rig (checks both num_rigs and qty_available)
                rigs_key = 'num_rigs' if 'num_rigs' in new_data else ('qty_available' if 'qty_available' in new_data else None)
                if rigs_key:
                    try:
                        rigs = float(new_data[rigs_key])
                        new_daily_fcst = rigs * float(payload.forecast_per_rig)
                        new_data['daily_forecast'] = round(new_daily_fcst, 2)
                    except (ValueError, TypeError):
                         pass

            # Recalculate Daily Variance (var1)
            # Logic: ((Actual - Forecast) / Forecast) * 100
            if department == "Milling_CIL":
                new_data['var1'] = calc_var(new_data.get('daily_actual'), new_data.get('daily_forecast'), is_ohs_dept, use_act_denom=is_ohs_dept)
                new_data['day2_var'] = calc_var(new_data.get('day2'), new_data.get('day2_forecast'), is_ohs_dept, use_act_denom=is_ohs_dept)
            elif 'daily_actual' in new_data and 'daily_forecast' in new_data:
                new_data['var1'] = calc_var(new_data['daily_actual'], new_data['daily_forecast'], is_ohs_dept, use_act_denom=is_ohs_dept)

            # Recalculate MTD Variance (var2)
            # Logic: ((MTD Actual - MTD Forecast) / MTD Forecast) * 100
            if 'mtd_actual' in new_data and 'mtd_forecast' in new_data:
                 new_data['var2'] = calc_var(new_data['mtd_actual'], new_data['mtd_forecast'], is_ohs_dept, use_act_denom=True)

            # Recalculate Budget Variance (var3)
            # For Geology department: third variance is Outlook (a) vs Full Forecast (b)
            # For other departments: standard Budget Variance (Full Forecast vs Full Budget)
            if department in ("Geology", "OHS") or (department == "Milling_CIL" and payload.metric_name == "Plant Feed Grade"):
                fcst_target = payload.full_forecast if not is_ohs_dept else (annual_target / 12.0)
                new_data['var3'] = calc_var(new_data.get('outlook'), fcst_target, is_ohs_dept, use_act_denom=True)
            else:
                new_data['var3'] = calc_var(payload.full_forecast, payload.full_budget, is_ohs_dept)

            record.data = new_data
            record.last_modification = {
                "at": datetime.now(timezone.utc).isoformat(),
                "by_user_id": _user.id,
                "username": _user.username
            }
            session.add(record)
            count += 1
        session.commit()
        
        # Recalculate metric month to ensure MTD, Outlook, and variances are correct
        try:
            recalculate_metric_month(department, payload.metric_name, year, month, session)
            # If Gold Recovery or Gold Contained cascade, also recalculate Recovery
            if department == "Milling_CIL" and payload.metric_name in ("Gold Recovery", "Gold Contained"):
                recalculate_metric_month(department, "Recovery", year, month, session)
            session.commit()
        except Exception as e:
            print(f"Error recalculating metric month after cascade: {e}")
            
        return {"updated_count": count}

    except Exception as e:
        logger.exception("ERROR cascading fixed input")
        raise HTTPException(status_code=500, detail="An internal server error occurred. Please contact support.")

# Serve Frontend Static Files
# We assume the backend is run from the project root (e.g. uvicorn backend.main:app)
# So "../frontend" might need adjustment if run from inside backend folder.
# Let's find the absolute path to be safe.
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_path = os.path.join(current_dir, "..", "frontend")

if os.path.exists(frontend_path):
    app.mount("/", CacheAwareStaticFiles(directory=frontend_path, html=True), name="static")
else:
    print(f"Warning: Frontend not found at {frontend_path}")
