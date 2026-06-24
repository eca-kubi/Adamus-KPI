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

# PyMySQL connect arguments. ``connect_timeout`` avoids hanging indefinitely when
# the database is unreachable; ``read_timeout`` / ``write_timeout`` prevent a
# single stalled socket from blocking a worker for too long.
connect_args = {
    "connect_timeout": 10,
    "read_timeout": 60,
    "write_timeout": 60,
}

# SQLAlchemy connection-pool tuning.
# ``pool_pre_ping=True`` verifies a connection is still alive before it is used.
# ``pool_recycle`` must be shorter than MariaDB's ``wait_timeout`` so idle
# connections are discarded before the server closes them.
# ``pool_size`` / ``max_overflow`` give enough headroom for 4 Gunicorn workers.
engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,  # 30 minutes; safe for default wait_timeout of 8h
    pool_timeout=30,
    echo=False,
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
