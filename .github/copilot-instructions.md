# Copilot Instructions for Adamus KPI Codebase

## Architecture & Big Picture
- **Client-Server Architecture**: The application has been refactored from a single-file monolith into a structured Full Stack application.
- **Backend**: Python with FastAPI (`backend/`). Handles API requests and database interactions using SQLModel.
- **Frontend**: Vanilla JavaScript (`frontend/`), served by the backend.
- **State Management**: Frontend holds transient state in `STATE` object (in `app.js`). Persistent data is managed by the backend API and database.

## Core Developer Workflows
- **Running the App**: 
  - Install dependencies: `pip install -r backend/requirements.txt`
  - Start Server: `uvicorn backend.main:app --reload` (Run from project root).
  - Access at `http://localhost:8000` (or `http://127.0.0.1:8000`).
- **Debugging**: 
  - **Backend**: Use standard Python debugging for `backend/` files.
  - **Frontend**: Use Browser DevTools. `app.js` contains the core application logic.
  - **APIs**: Check `api.js` for endpoints and `backend/main.py` for route definitions.
- **Testing**:
  - Validate logic changes by tracing data flows through `calculations.js`/`app.js`.

## Project-Specific Patterns
- **Legacy Monolith Logic**: `app.js` contains the bulk of the original logic (~8000+ lines). Be careful when modifying it. Prefer extracting pure logic to `calculations.js` or `api.js`.
- **Departmental Prefixes**: DOM IDs and variable names are strictly prefixed by department:
  - `geo` (Geology)
  - `crush` (Crushing)
  - `mill` (Milling/CIL)
  - `ohs` (Health & Safety)
- **Calculation Chains**: KPI logic triggers cascading updates. 
  - Example Pattern: Input -> Update Forecast -> Compute Variance -> Compute MTD.
- **Vanilla JS & DOM**:
  - Use `document.getElementById` or helper functions in `dom.js`.
- **Styling**:
  - `frontend/css/style.css` contains all styles.
  - Use CSS Variables defined in `:root` (e.g., `--primary`, `--bg-secondary`).
  - Follow the card/shadow design system: `class="card"`, `var(--shadow)`.

## Critical Files
- `backend/main.py`: FastAPI application entry point & static file serving.
- `backend/models.py`: Database schemas (SQLModel).
- `frontend/js/app.js`: Main business logic (Legacy Monolith Logic).
- `frontend/js/api.js`: Client-side API interactions.
- `frontend/js/calculations.js`: Extracted calculation logic.
- `frontend/index.html`: Main HTML structure.
