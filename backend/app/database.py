from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Example connection string: "postgresql://username:password@localhost:5432/reconciliator_db"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin1@localhost:5432/reconciliator_db")

engine = create_engine(DATABASE_URL, echo=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency for routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
