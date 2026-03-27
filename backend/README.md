# FitOps Backend Team README

Use this as the single backend planning and progress document.
Each teammate should update their assigned section as they build.
Do not create per-folder README files; all backend updates belong in this file.

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
