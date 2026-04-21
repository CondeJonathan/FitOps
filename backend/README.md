# FitOps Backend

Backend API for FitOps, built with Flask and SQLAlchemy.

## Core Files

- `backend/server.py`: Flask app and API routes
- `backend/db/database.py`: engine/session setup and DB initialization
- `backend/db/models.py`: ORM models and enums
- `backend/scripts/seed.py`: local seed data for development

## Backend Setup

From the repository root:

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m backend.scripts.seed
python -m backend.server
```

API base URL: `http://127.0.0.1:5000`

## API Route Map

### General

- `GET /`
- `GET /api/health`

### Authentication

- `POST /api/register`
- `POST /api/login`

### Member

- `GET /api/classes`
- `GET /api/member/dashboard`
- `POST /api/classes/<session_id>/toggle-booking`

### Staff

- `GET /api/staff/dashboard`
- `POST /api/staff/tickets`
- `POST /api/staff/maintenance`
- `POST /api/staff/grant-role`

## Development Notes

- CORS is enabled in `server.py` for frontend development.
- Staff-role behavior uses email/domain logic and role data from the DB.
- Password verification currently supports hashed values and legacy plain-text fallback for older local data.

## Team Workflow

- Pull latest `main` before backend changes.
- Keep backend commits focused by feature/area.
- Coordinate before changing shared files like `server.py` or `models.py`.
- Re-run the seed script after schema updates.
