# FitOps

Gym management app with a Flask API, SQLAlchemy ORM, and SQLite storage.

## 📦 Project Overview

FitOps is a role-based gym management system that includes:

- Login system (member vs staff)
- Member dashboard (view sessions, book sessions)
- Staff dashboard (manage sessions, tickets, maintenance)
- Training session scheduling
- Session booking system
- Ticket system for staff issues
- Maintenance logs
- Demo-friendly API endpoints for classroom walkthroughs

## Backend Status

The backend now provides a runnable API with:

- Bearer-token authentication and member vs staff authorization
- CRUD endpoints for members, sessions, bookings, tickets, maintenance, and payments
- Business-rule checks for booking conflicts, trainer conflicts, and safer deletes
- Standardized JSON responses and paginated list endpoints
- Demo reset + enum metadata endpoints for local development and presentations

Routes currently available:

- `GET /api/health`
- `GET /api/meta/enums`
- `POST /api/demo/reset`
- `POST /api/login`
- `GET /api/me`
- `GET /api/staff`
- `GET /api/members`
- `POST /api/members`
- `GET /api/members/<id>`
- `PATCH /api/members/<id>`
- `DELETE /api/members/<id>`
- `GET /api/sessions`
- `POST /api/sessions`
- `PATCH /api/sessions/<id>`
- `DELETE /api/sessions/<id>`
- `POST /api/sessions/<id>/book`
- `GET /api/bookings`
- `POST /api/bookings/<id>/cancel`
- `GET /api/tickets`
- `POST /api/tickets`
- `PATCH /api/tickets/<id>`
- `GET /api/maintenance`
- `POST /api/maintenance`
- `PATCH /api/maintenance/<id>`
- `GET /api/payments`
- `POST /api/payments`
- `PATCH /api/payments/<id>`
- `GET /api/dashboard/member/<id>`
- `GET /api/dashboard/staff`

The app uses a local SQLite database file named `gym.db` in the project root by default.

Most application routes now require:

```http
Authorization: Bearer <token>
```

Use the token returned by `POST /api/login`.

Successful responses use this shape:

```json
{
  "success": true
}
```

Error responses use this shape:

```json
{
  "success": false,
  "message": "Validation or authorization message"
}
```

List endpoints such as `GET /api/members`, `GET /api/sessions`, `GET /api/bookings`, `GET /api/tickets`,
`GET /api/maintenance`, and `GET /api/payments` support:

```text
page=<number>&page_size=<number>
```

They return both `items` and `meta`:

```json
{
  "success": true,
  "items": [],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 0,
    "total_pages": 0,
    "has_next": false,
    "has_previous": false
  }
}
```

## Getting Started

### 1. Create a virtual environment

```bash
python3 -m venv .venv
```

### 2. Install dependencies

```bash
.venv/bin/python -m pip install -r requirements.txt
```

### 3. Seed demo data

```bash
.venv/bin/python -m backend.scripts.seed
```

If you want a clean rebuild after schema changes:

```bash
rm -f gym.db
FITOPS_RESET_DB=1 .venv/bin/python -m backend.scripts.seed
```

### 4. Start the API server

```bash
.venv/bin/python -m backend.app
```

If port `5000` is busy on your machine:

```bash
FITOPS_PORT=5050 .venv/bin/python -m backend.app
```

### 5. Run the backend tests

```bash
.venv/bin/python -m unittest discover -s backend/tests
```

## Demo Credentials

- `member@test.com / member123`
- `staff@test.com / staff123`
- All other `*.demo` accounts use `demo123`

## Auth Flow

1. `POST /api/login` with email, password, and role
2. Copy the returned `token`
3. Send `Authorization: Bearer <token>` on protected routes
4. Optionally call `GET /api/me` to confirm the logged-in profile

## What `seed.py` creates

The seed script creates and updates demo data for:

- 6 staff accounts
- 6 member accounts
- 6 training sessions
- multiple bookings
- multiple tickets
- multiple maintenance logs
- sample payments

## Quick Demo Flow

Use these API calls in class if you want a fast backend walkthrough:

1. `POST /api/login` with the member account
2. `GET /api/me`
3. `GET /api/sessions`
4. `POST /api/sessions/2/book`
5. Login as staff and call `GET /api/dashboard/staff`
6. `POST /api/payments` to create a membership payment
7. `GET /api/tickets`
8. `GET /api/maintenance`
9. `POST /api/demo/reset` if you want to restore the seeded state before another demo round

## Good Next Backend Steps

If you keep building this after class, the next high-value improvements are:

- move route handlers into blueprints or service modules
- add database migrations instead of rebuilding `gym.db`
- switch from SQLite to PostgreSQL for team or production use
- add OpenAPI docs and broader integration tests

## Team Notes

- Do not commit `gym.db`
- Recommended workflow:
  - Clone repo
  - Run setup steps
  - Generate your own local database

## Project Structure

Key backend files:

- `backend/app.py` - Flask API routes
- `backend/db/database.py` - SQLAlchemy engine/session setup
- `backend/db/models.py` - ORM models
- `backend/scripts/seed.py` - demo data seeding
- `backend/security.py` - password hashing helpers
- `backend/tests/test_api.py` - backend smoke tests

Frontend planning files remain in:

- `frontend/README.md`
- `TEAM_TEMPLATE.md`
