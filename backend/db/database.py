"""SQLAlchemy database setup for FitOps.

- Uses SQLite file `gym.db` in the project root.
- Exports `Base`, `engine`, `SessionLocal`, and `get_db()` (DI helper).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./gym.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Yield a DB session and close it after the request."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Ensure the SQLite file exists (created on first connection).
with engine.connect():
    pass

