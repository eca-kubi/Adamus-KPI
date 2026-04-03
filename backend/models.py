from typing import Optional, List, Dict, Any
from datetime import date as dt_date, datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import JSON, Column

class KPIRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    department: str = Field(index=True)
    subtype: Optional[str] = Field(default=None) # e.g. "ore", "grade"
    date: dt_date = Field(index=True)
    metric_name: str # e.g. "Gold Contained", "Recovery"
    
    # Store flexible numeric data: daily_actual, daily_forecast, var1, mtd_actual, etc.
    data: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Audit fields
    created_by_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_modification: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: Optional[str] = Field(default=None)
    full_name: Optional[str] = Field(default=None)
    hashed_password: str
    disabled: Optional[bool] = Field(default=False)
    departments: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSON))
    role: Optional[str] = Field(default="Staff")
    phone_number: Optional[str] = Field(default=None)
    allowed_metrics: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSON))

