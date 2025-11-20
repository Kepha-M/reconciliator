# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL

# Add pool_pre_ping=True to automatically check connections
# If your database requires SSL, append ?sslmode=require to DATABASE_URL
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=2
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Yields a database session for dependency injection in FastAPI routes.
    Ensures proper session closure.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
