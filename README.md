# 🏋️ FitOps

Gym management web app built with Python, SQLAlchemy, and SQLite.

## 📦 Project Overview

FitOps is a role-based gym management system that includes:

- Login system (member vs staff)
- Member dashboard (view sessions, book sessions)
- Staff dashboard (manage sessions, tickets, maintenance)
- Training session scheduling
- Session booking system
- Ticket system for staff issues
- Maintenance logs

## 🗄️ Database Behavior (IMPORTANT)

The app uses a local SQLite database file: `gym.db` (created in the project root).

### How it works

- Importing `database.py`:
  - Creates a connection
  - Creates `gym.db` if it does not exist
- Tables are not created automatically
- You must run the seed script to create them
- DB Browser for SQLite simply opens the `gym.db` file

## 🚀 Getting Started (First-Time Setup)

### 1. Navigate to the project folder

```bash
cd "path\to\FitOps"
```

### 2. Create virtual environment

```bash
python -m venv .venv
```

### 3. Activate virtual environment

```bash
.\.venv\Scripts\Activate.ps1
```

If activation fails (PowerShell security), run this once:

```bash
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Type `Y`, then retry:

```bash
.\.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 5. Create database + seed data

```bash
python -m scripts.seed
```

## 🌱 What `seed.py` does

Creates all database tables using:

```python
Base.metadata.create_all(bind=engine)
```

Inserts sample data (only if missing):

- 1 staff user
- 1 member user
- 1 training session
- 1 booking
- 1 ticket

## ⚠️ If you already have an old `gym.db`

If your database schema changed, you may get errors.

Fix:

- Close DB Browser (if open)
- Delete `gym.db`
- Run:

```bash
python -m scripts.seed
```

## 👥 Team Notes

- DO NOT commit `gym.db` 
- Recommended workflow:
  - Clone repo
  - Run setup steps
  - Generate your own local database

## 🧠 Key Idea

This system uses:

- One `users` table for authentication
- Role-based logic (member vs staff)
- Separate tables for member and staff data
- Shared tables for sessions, bookings, and operations
- As continue with the front-end update the README