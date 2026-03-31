# FitOps Backend Team README

Use this as the single backend planning and progress document.
Each teammate should update their assigned section as they build.
Do not create per-folder README files; all backend updates belong in this file.

## Current Backend Snapshot

Current backend is ready for classroom demos and team development with:

- Flask API entrypoint: `backend/app.py`
- SQLAlchemy models in `backend/db/models.py`
- Demo seed data in `backend/scripts/seed.py`
- Password hashing helper in `backend/security.py`
- Local tests in `backend/tests/`
- CRUD coverage for members, sessions, tickets, maintenance, and payments
- Demo utility endpoints for enum metadata and full demo reset
- Bearer-token authentication for protected routes
- Role-based authorization for member vs staff behavior
- Standardized `success` / `message` JSON envelopes
- Pagination support on list endpoints with `page` and `page_size`

Useful commands:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m backend.scripts.seed
.venv/bin/python -m backend.app
```

If you need a clean rebuild after schema changes:

```bash
rm -f gym.db
FITOPS_RESET_DB=1 .venv/bin/python -m backend.scripts.seed
```

Run tests:

```bash
.venv/bin/python -m unittest discover -s backend/tests
```

Demo credentials:

- `member@test.com / member123`
- `staff@test.com / staff123`
- other seeded `*.demo` users: `demo123`

Protected API usage:

1. Call `POST /api/login`
2. Copy `token` from the response
3. Send `Authorization: Bearer <token>` on protected requests

List response pattern:

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

Validation and auth failures return:

```json
{
  "success": false,
  "message": "Readable error message"
}
```

## Goals

- Keep backend planning in one place
- Organize database and backend logic clearly
- Reduce overlap while working in one shared `main` branch

## Folder Structure

Current backend structure:

- `db/` for database setup and ORM models
- `scripts/` for seeding and backend utility scripts

Current source-of-truth files:

- `db/database.py`
- `db/models.py`
- `scripts/seed.py`

## Team Update Rules

1. Pull latest `main` before starting work.
2. Work only in your assigned backend area.
3. Keep commits focused on one backend feature.
4. Coordinate before editing shared files.
5. Update this README section status when you start/finish work.

## Backend Work Sections (Team Updates)

Use this format in every section:

- Owner:
- Status: Not started | In progress | Done
- Last updated:
- Notes:
- Blocking issues:

---

## 1) Database Layer

- Folder: `db/`
- Owner:
- Status:
- Last updated:
- Notes:
- Blocking issues:

## 2) Seed + Utility Scripts

- Folder: `scripts/`
- Owner:
- Status:
- Last updated:
- Notes:
- Blocking issues:

## Backend Merge Conflict Prevention Checklist

- [ ] Pulled latest `main` before starting
- [ ] Limited edits to assigned backend area
- [ ] Coordinated shared-file changes
- [ ] Updated this backend README status
- [ ] Commit message clearly matches backend change
