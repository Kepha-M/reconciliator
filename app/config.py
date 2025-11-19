# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:admin1@localhost/reconciliator_db")
SECRET_KEY = os.getenv("SECRET_KEY", "kepha")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
