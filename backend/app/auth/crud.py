# app/auth/crud.py
from sqlalchemy.orm import Session
from app.auth.models import User
from app.auth.utils import hash_password

def get_user_by_email(db: Session, email: str):
    """
    Fetch a user by email.
    """
    return db.query(User).filter(User.email == email).first()

def get_all_users(db: Session):
    return db.query(User).all()

def create_user(db: Session, username: str, email: str, password: str, role: str = "user"):
    hashed_pw = hash_password(password)  # truncates automatically
    db_user = User(username=username, email=email, password=hashed_pw, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user