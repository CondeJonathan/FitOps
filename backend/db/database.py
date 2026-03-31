"""SQLAlchemy database setup for FitOps.

By default the app uses a local SQLite file named ``gym.db`` in the project
root. Tests and demos can override the database by setting
``FITOPS_DATABASE_URL`` before importing this module.
"""

from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("FITOPS_DATABASE_URL", "sqlite:///./gym.db")
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=CONNECT_ARGS)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False, bind=engine)
Base = declarative_base()


def init_db() -> None:
    """Create all known tables."""

    Base.metadata.create_all(bind=engine)


def reset_db() -> None:
    """Drop and recreate all tables.

    This is handy for a clean classroom demo when schema changes have happened.
    """

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def get_db():
    """Yield a DB session and close it after the request."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Ensure the configured database file exists on first import.
with engine.connect():
    pass
