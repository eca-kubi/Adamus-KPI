# Adamus KPI Portal — Agent Guide

This document is written for AI coding agents that need to understand, build, test, and modify the **Adamus KPI Portal** project. It reflects the actual files and conventions in this repository.

## 1. Project Overview

The Adamus KPI Portal is an internal dashboard used by Adamus Resources Limited to track and manage Key Performance Indicators (KPIs) across several departments:

- OHS
- Milling_CIL
- Mining
- Crushing
- Geology
- Engineering

It is a **single-server web application** with a Python/FastAPI backend and a vanilla JavaScript frontend that is served as static files by the same FastAPI process.

### High-level architecture

- **Backend**: `backend/main.py` (FastAPI application entry point).
- **Database**: MySQL (MariaDB is used in Docker) accessed through SQLModel/SQLAlchemy with PyMySQL.
- **Migrations**: Alembic, configured in `alembic.ini` with scripts under `backend/migrations/`.
- **Frontend**: `frontend/index.html` plus `frontend/js/` and `frontend/css/`, served via `fastapi.staticfiles.StaticFiles` mounted at `/`.
- **Auth**: JWT access tokens (`/api/login`, `/api/token`), Argon2 password hashing, role-based access control (`Admin` vs `Staff`).

### Key configuration files

- `backend/requirements.txt` — Python dependencies. There is no `pyproject.toml`, `setup.py`, or `package.json`.
- `.env.example` — Template for required environment variables.
- `alembic.ini` — Alembic configuration.
- `docker-compose.yml` / `docker-compose.prod.yml` / `docker-compose.override.yml` — Local and production orchestration.
- `Dockerfile` — Multi-stage build of the application image.
- `start.sh` — Container startup script (DB user init, migrations, optional seed, Gunicorn).
- `init-db.sh` — Creates the Alembic and application DB users with minimal privileges.
- `.pre-commit-config.yaml` — Git hooks for YAML validation, Bandit security scan, and Gitleaks secret detection.
- `.github/workflows/build-and-push.yml` — CI that builds a Docker image and pushes it to GitHub Container Registry.

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Language | Python 3.8+ (Docker image uses Python 3.11) |
| Web framework | FastAPI |
| Server runtime | Uvicorn (development) / Gunicorn + Uvicorn workers (production) |
| ORM / models | SQLModel (SQLAlchemy 2.x style) |
| Database driver | PyMySQL |
| Database | MySQL / MariaDB 10.11 |
| Migrations | Alembic |
| Auth | OAuth2PasswordBearer, python-jose (HS256), passlib with Argon2 |
| Frontend | HTML5, Bootstrap 5, vanilla JavaScript, CSS3 |
| Email | SMTP or Resend API |
| SMS | SMSOnlineGH API |
| Profiling | pyinstrument (opt-in via `ENABLE_PROFILING`) |
| Container runtime | Docker / Docker Compose |
| Deployment target | Coolify, using images published to GHCR |

## 3. Project Structure

```
.
├── backend/
│   ├── main.py                  # FastAPI app, API routes, KPI recalculation logic
│   ├── models.py                # SQLModel table definitions (KPIRecord, User)
│   ├── database.py              # SQLAlchemy engine + session factory; enforces MySQL
│   ├── security.py              # JWT/Argon2 helpers
│   ├── profiler.py              # Optional pyinstrument profiling + memory monitor
│   ├── seed_kpi_2026.py         # Standalone seed script for Q1 2026 demo data
│   ├── verify_variance.py       # Manual verification script for variance math
│   ├── verify_cascade.py        # Manual verification script for cascade updates
│   └── migrations/              # Alembic migration scripts
├── frontend/
│   ├── index.html               # Single-page app shell
│   ├── css/style.css            # Custom theme built on Bootstrap
│   ├── js/
│   │   ├── api.js               # All fetch() calls and token handling
│   │   ├── app.js               # Main UI state and business logic (large legacy monolith)
│   │   ├── calculations.js      # Small pure helper functions (variance, MTD)
│   │   └── dom.js               # Bootstrap DOM helper factory functions
│   └── images/                  # Logos and icons
├── alembic.ini                  # Alembic configuration
├── docker-compose.yml           # Local full-stack compose
├── docker-compose.prod.yml      # Production compose using GHCR image
├── docker-compose.override.yml  # Local port/volume overrides
├── Dockerfile
├── start.sh                     # Production container entrypoint
├── init-db.sh                   # DB user bootstrap script
├── .env.example
├── .pre-commit-config.yaml
└── .github/workflows/build-and-push.yml
```

### Code organization notes

- The backend is not split into routers or services; most behavior lives in `backend/main.py`.
- `backend/models.py` defines only two tables:
  - `KPIRecord` — stores all KPI data (daily records and monthly fixed inputs) in a flexible `data` JSON column.
  - `User` — stores accounts, roles, departments, allowed metrics, and password-reset codes.
- Business logic is duplicated/synchronized in two places:
  - `backend/main.py` (`recalculate_metric_month`, `get_summary_dashboard`, `cascade_fixed_input`) for the server-side source of truth.
  - `frontend/js/app.js` for the interactive UI and import templates.
- KPI data uses two subtypes:
  - `fixed_input` — monthly budget/forecast record on the 1st of the month.
  - default / `daily_input` — daily records.

## 4. Build and Run Commands

All commands assume you are in the project root.

### Local development (without Docker)

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your MySQL connection and SECRET_KEY.

# 4. Apply migrations
alembic upgrade head

# 5. Start the server with hot reload
uvicorn backend.main:app --reload
```

The app is available at:

- Dashboard: http://127.0.0.1:8000/
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

### Local development with Docker Compose

```bash
# Copy and edit environment
cp .env.example .env

# Bring up the app and MariaDB
docker compose up --build
```

`docker-compose.override.yml` is loaded automatically and exposes:

- App on `localhost:8000`
- MariaDB on `localhost:3307`
- Live code mounts for `backend/` and `frontend/`

### Production deployment

The production image is built by `Dockerfile` and started with `start.sh`:

```bash
docker compose -f docker-compose.prod.yml up -d
```

`start.sh` performs these steps on every container start:

1. Runs `init-db.sh` to ensure `alembic_user` and the app DB user exist.
2. Runs `alembic upgrade head`.
3. If `SEED_DB=true` or `1`, runs `python backend/seed_kpi_2026.py`.
4. Starts Gunicorn with 4 Uvicorn workers bound to `0.0.0.0:8000`.

> **Important:** Set `SEED_DB=false` in production to avoid overwriting real data.

### CI/CD

- On every push to `master`, `.github/workflows/build-and-push.yml` builds and pushes `ghcr.io/<owner>/arl-kpi-app:latest`.
- After the push, the workflow triggers a Coolify deployment via webhook.
- The production compose file references this GHCR image and attaches the database container to an external `coolify` network.

## 5. Database Migrations

```bash
# Generate a new migration from model changes
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Downgrade one revision
alembic downgrade -1
```

- Migration scripts live in `backend/migrations/versions/`.
- `backend/migrations/env.py` reads `ALEMBIC_DATABASE_URL` from `.env`, falling back to `DATABASE_URL`. It validates that the URL uses `mysql+pymysql://`.
- The app database user should have only `SELECT`, `INSERT`, `UPDATE`, `DELETE`. The `alembic_user` account needs full schema privileges for migrations.

## 6. Testing Instructions

There is **no automated test suite** (no `pytest` configuration or `tests/` directory). Manual verification is done with two standalone scripts:

```bash
# Verify variance calculations for OHS, standard metrics, weighted-grade metrics,
# and Toll Grade (tonne-weighted, zero weight when Toll Tonnes is missing)
python backend/verify_variance.py

# Verify cascade-fixed update propagation
python backend/verify_cascade.py
```

Both scripts create an in-memory SQLite database, seed test records, invoke logic from `backend/main.py`, and run `assert` checks. They do not require a running server or MySQL.

When making logic changes, also test through the UI:

1. Log in as an admin.
2. Enter daily values for a metric.
3. Enter the corresponding monthly fixed inputs.
4. Confirm that `mtd_actual`, `mtd_forecast`, `outlook`, `var1`, `var2`, and `var3` update consistently on the department view and the summary dashboard.
5. For Milling/CIL metrics, confirm that the `day2` (Day-2 Actual) and `day2_forecast` (Day-2 Forecast) fields are saved and displayed in the daily table and summary dashboard.

## 7. Code Style Guidelines

- Follow the existing Python style in `backend/main.py`:
  - Relative imports inside the package (`from .database import ...`, `from .models import ...`).
  - Typed Pydantic request/response models declared near the routes that use them.
  - Compute-heavy helpers such as `recalculate_metric_month` are pure functions that take a `Session`.
- JavaScript:
  - The frontend uses global functions and a global `STATE` object in `app.js`.
  - Prefer extracting pure calculation helpers into `frontend/js/calculations.js` rather than adding more logic to `app.js`.
  - Use the `DOM` helper in `frontend/js/dom.js` for Bootstrap-styled elements.
  - Keep `DEPARTMENT_METRICS` / `DEPT_METRICS` in sync between the backend (`backend/main.py`) and frontend (`frontend/js/app.js`).
  - **Cache busting**: `frontend/index.html` loads CSS/JS assets with a query-string version (e.g., `?v=20260622_3`). Whenever you modify any static asset under `frontend/css/` or `frontend/js/`, bump the version token on the corresponding `<link>` or `<script>` tag (and keep all asset version tokens in sync) so browsers and CDNs fetch the latest files instead of serving cached versions.
- Environment configuration:
  - Load environment variables with `python-dotenv` (`load_dotenv()`).
  - Never hardcode secrets; the pre-commit hooks include Gitleaks and Bandit to catch this.
- SQLModel models:
  - Store variable KPI fields in the JSON `data` column; only metadata (department, date, metric name, subtype) is normalized.

## 8. Security Considerations

- **Database**: `backend/database.py` and `backend/migrations/env.py` enforce `mysql+pymysql://`. The application will refuse to start with SQLite or Postgres URLs.
- **Passwords**: Hashed with Argon2 via `passlib` in `backend/security.py`. Plain passwords are never stored.
- **Authentication**: JWT tokens signed with HS256. `SECRET_KEY`, `ALGORITHM`, and `ACCESS_TOKEN_EXPIRE_MINUTES` are controlled by environment variables.
- **Authorization**:
  - `Admin` role can manage users and edit all metrics.
  - `Staff` role is restricted to metrics listed in their `allowed_metrics` JSON field.
  - Users cannot change their own disabled status.
- **Email restriction**: Account creation endpoints reject email addresses that are not `@adamusgh.com`.
- **Database privileges**: `init-db.sh` creates a low-privilege application user (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) and a separate `alembic_user` with schema privileges.
- **Secrets scanning**: `.pre-commit-config.yaml` runs Bandit (`-lll -r backend`) and Gitleaks on commits.
- **Environment files**: `.env` and `.env.*` are gitignored. Only `.env.example` is tracked.
- **Profiling**: The `ProfilingMiddleware` is enabled only when `ENABLE_PROFILING=true`. It writes HTML profiles to a `profiles/` directory when `?profile=true` is appended to a request.

## 9. Common Tasks

| Task | Command |
|------|---------|
| Install dependencies | `pip install -r backend/requirements.txt` |
| Run dev server | `uvicorn backend.main:app --reload` |
| Create migration | `alembic revision --autogenerate -m "message"` |
| Apply migrations | `alembic upgrade head` |
| Seed demo data | `python backend/seed_kpi_2026.py` |
| Verify variance logic | `python backend/verify_variance.py` |
| Verify cascade logic | `python backend/verify_cascade.py` |
| Run pre-commit hooks | `pre-commit run --all-files` |
| Local Docker stack | `docker compose up --build` |
| Production Docker stack | `docker compose -f docker-compose.prod.yml up -d` |

## 10. Notes for Agents

- Before editing calculation logic, read the relevant section in both `backend/main.py` and `frontend/js/app.js`; they must stay consistent.
- `app.js` is large and contains legacy monolith logic. Make small, focused changes and prefer extracting helpers.
- Adding a new department or metric requires updating `DEPARTMENT_METRICS` in `backend/main.py` and `DEPT_METRICS` / `IMPORT_CONFIGS` in `frontend/js/app.js`.
- Milling/CIL daily records store both `day2` (previous day's actual) and `day2_forecast` (previous day's forecast) in the JSON `data` column. Both fields are surfaced in forms, tables, imports, and the summary dashboard.
- **Engineering MTD Actual is a plain average**: for every Engineering metric, `MTD Actual` is the unweighted mean of the `daily_actual` values entered so far in the month (days with no actual are skipped, so a blank day never drags the average down). The rule is implemented in three places that must stay in sync: `recalculate_metric_month` and `get_summary_dashboard` in `backend/main.py`, and the `updateMTDActual` preview inside each `renderEngineering*Form` in `frontend/js/app.js`. Do not reintroduce the older `sum(daily_actual * daily_forecast) / sum(daily_actual)` weighting, and keep `backend/seed_kpi_2026.py` aligned.
- **Engineering MTD Forecast mirrors the daily forecast**: for every Engineering metric, `MTD Forecast` is the record's own `daily_forecast` (which is driven by the monthly Fixed Input), *not* a running total of the month's forecasts. Keep it in sync in the same three places as the MTD Actual rule and do not accumulate it in `backend/seed_kpi_2026.py`.
- **Toll Grade MTD is a tonne-weighted average**: for the Milling/CIL `Toll Grade` metric, both `MTD Actual` and `MTD Forecast` are weighted averages of the daily grade keyed by the `Toll Tonnes` recorded for the same date — `Σ(grade × Toll Tonnes) / Σ(Toll Tonnes)`, using `daily_actual` for the actual side and `daily_forecast` for the forecast side. A day with no `Toll Tonnes` record is given a weight of `0`, so it drops out of both the numerator and the denominator; if no day in the month carries a weight (e.g. Toll Tonnes has not been entered yet) the MTD is `0` because there is no weighted data yet — never a plain average. Do not treat Toll Grade as a cumulative sum. The rule lives in `recalculate_metric_month` and `get_summary_dashboard` in `backend/main.py`, and in the `updateCalculations`/`handleDateChange` logic of `renderMillingGoldContainedForm` in `frontend/js/app.js`. Changing a `Toll Tonnes` record must trigger a `Toll Grade` recalculation (the save, import, delete and cascade endpoints all do this). CSV imports leave Toll Grade MTD values to the backend recalculation because the import batch does not carry per-day Toll Tonnes weights. `backend/verify_variance.py` checks this via `verify_toll_grade_weighted_mtd()` and `verify_toll_grade_zero_weight_days()`.
- **Variance convention when the forecast is 0**: for non-OHS metrics the variance is `"0%"` only when the actual is also `0`; if the forecast is `0` and the actual is non-zero the variance is `"-"` (not applicable), never a misleading `"0%"`. This is implemented in the three `calc_var` helpers in `backend/main.py` (`recalculate_metric_month`, `get_summary_dashboard`, `cascade_fixed_input`), in `calculateVariance` (`frontend/js/calculations.js`, used by `attachVarianceListener`), and in the stockpile forms in `frontend/js/app.js`. OHS keeps its own lower-is-better rule (`"0%"` / `"-100%"`). `backend/verify_variance.py` covers this in the stockpile and grade-stockpile sections.
- **Bump cache-busting query strings**: After changing `frontend/css/style.css` or any file under `frontend/js/`, update the `?v=...` tokens in `frontend/index.html` so clients request the latest static assets rather than stale cached copies. Keep all asset tokens in sync.
- **Engineering Daily Forecast is mandatory**: for every Engineering daily input, `Daily Forecast` must be populated before the record is saved (it is auto-populated from the metric's monthly Fixed Input) so the variance against the daily actual is meaningful. The entry forms flag the read-only field via `data-required-label`, which `DOM.createButton` in `frontend/js/dom.js` validates (it checks explicitly-flagged read-only fields and skips only disabled ones). The backend mirrors this in `backend/main.py` via `_validate_engineering_daily_forecast`, called from `create_kpi_record`.
- Do not commit `.env` files. If you add new required environment variables, update `.env.example` and this file.
- Do not run `git commit`, `git push`, `git reset`, or `git rebase` unless explicitly asked.
