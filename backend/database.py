import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session

load_dotenv()

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError(
        "DATABASE_URL is required and must be a MySQL URL, e.g. "
        "mysql+pymysql://user:password@localhost/adamus_kpi"
    )

if not database_url.startswith("mysql+pymysql://"):
    raise RuntimeError(
        "DATABASE_URL must use MySQL with PyMySQL. Expected prefix: mysql+pymysql://"
    )

connect_args = {}

engine = create_engine(database_url, connect_args=connect_args, pool_pre_ping=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
