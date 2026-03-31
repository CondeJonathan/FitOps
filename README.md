# FitOps

FitOps is a full-stack gym operations app with:

- **Backend:** Flask + SQLAlchemy + SQLite
- **Frontend:** React + Vite

It supports member registration/login, class booking, member dashboard views, and staff operations for scheduling, tickets, maintenance, and membership updates.

## Project Structure

- `backend/` Flask API, database models, and seed script
- `frontend/` React UI (Vite)
- `requirements.txt` Python dependencies

## Quick Start

### 1) Backend setup

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m backend.scripts.seed
python .\backend\server.py
```

Backend runs on `http://127.0.0.1:5000`.

### 2) Frontend setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on the Vite dev URL shown in terminal (typically `http://localhost:5173`).

## Current API Endpoints

### Auth + health

- `GET /api/health`
- `GET /`
- `POST /api/register`
- `POST /api/login`

### Member flows

- `GET /api/classes`
- `GET /api/member/dashboard`
- `POST /api/classes/<session_id>/toggle-booking`

### Staff flows

- `GET /api/staff/dashboard`
- `POST /api/staff/tickets`
- `POST /api/staff/maintenance`
- `POST /api/staff/grant-role`

## Notes

- Database is stored locally (SQLite) and initialized through the seed script.
- Staff role behavior is tied to `@fitops.com` email handling in the backend logic.
- See `backend/README.md` for backend-focused developer notes.
