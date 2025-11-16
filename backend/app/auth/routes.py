# app/auth/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.schemas import UserCreate, Token
from app.auth.crud import get_user_by_email, create_user
from app.auth.utils import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# -------------------------------
# Register New User
# -------------------------------
@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password safely using argon2 (no truncation needed)
    hashed_password = hash_password(user.password)

    # Create user in DB
    new_user = create_user(
        db,
        username=user.username,
        email=user.email,
        password=user.password,
        role=user.role
    )

    # Generate JWT token
    token = create_access_token({"sub": new_user.email})

    return {"access_token": token, "token_type": "bearer"}

# -------------------------------
# Login Existing User
# -------------------------------
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Fetch user by email
    user = get_user_by_email(db, form_data.username)
    print("Logging in user:", form_data.username)
    user = get_user_by_email(db, form_data.username)
    print("User fetched from DB:", user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Verify password using argon2 (no truncation)
    if not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Generate JWT token
    token = create_access_token({"sub": user.email})

    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def read_me(current_user: dict = Depends(get_current_user)):
    return current_user