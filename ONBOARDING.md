# Adamus KPI - Onboarding Guide

Welcome to the Adamus KPI project! This guide will help you set up your development environment and get the application running.

## 1. Project Overview

**Adamus KPI** is a dashboard application for tracking Key Performance Indicators. It consists of:
- **Backend**: Python FastAPI application (located in `backend/`).
- **Frontend**: Vanilla JavaScript, HTML, and CSS (located in `frontend/`), served by the backend.
- **Database**: SQLModel (SQLAlchemy) with Alembic for migrations (supports MySQL/SQLite).

## 2. Prerequisites

Before you begin, ensure you have the following installed:
- **Python 3.8+**
- **Git**
- **MySQL Server** (Optional, can use SQLite for local dev if configured)

## 3. Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd Adamus-KPI
    ```

2.  **Create a virtual environment**:
    It is recommended to use a virtual environment to manage dependencies.
    ```bash
    # Windows
    python -m venv .venv
    .venv\Scripts\activate

    # macOS/Linux
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```

## 4. Configuration

1.  **Environment Variables**:
    Copy the example environment file to create your own local configuration.
    ```bash
    cp .env.example .env
    ```

2.  **Edit `.env`**:
    Open `.env` and configure your database connection and secret key.
    ```ini
    # Example .env configuration
    DATABASE_URL="mysql+pymysql://user:password@localhost/adamus_kpi_db"
    
    # Auth
    SECRET_KEY="your-super-secret-key"
    ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```
    *Note: If using SQLite for local testing, you can set `DATABASE_URL="sqlite:///./backend/database.db"`.*

## 5. Running the Application

1.  **Apply Database Migrations** (if applicable):
    If the project uses Alembic for migrations, run:
    ```bash
    alembic upgrade head
    ```
    *Or if using `sqlmodel.create_db_and_tables()` in `main.py` startup event, just running the app will create tables.*

2.  **Start the Server**:
    Run the FastAPI server using Uvicorn. The `--reload` flag enables hot-reloading for development.
    ```bash
    uvicorn backend.main:app --reload
    ```

3.  **Access the Application**:
    - **Frontend Dashboard**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
    - **API Documentation (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
    - **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## 6. Project Structure

- `backend/`: Contains the FastAPI application code.
  - `main.py`: Entry point for the application.
  - `models.py`: SQLModel database models.
  - `database.py`: Database connection and session management.
  - `security.py`: Authentication logic (JWT, password hashing).
- `frontend/`: Contains the static frontend files.
  - `index.html`: Main entry point.
  - `js/`: JavaScript logic for the dashboard.
  - `css/`: Styling.
- `alembic.ini`: Configuration for Alembic migrations.

## 7. Common Commands

- **Run Tests**: (Add command if tests exist, e.g., `pytest`)
- **Generate Migration**: `alembic revision --autogenerate -m "message"`
- **Apply Migration**: `alembic upgrade head`

---
*If you encounter any issues, please check the project issue tracker or contact the team.*
