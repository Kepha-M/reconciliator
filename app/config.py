# app/config.py
import os
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

# Local Postgres configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:admin1@localhost:5432/reconciliator_db"
)

# Secret key for JWT and other security purposes
SECRET_KEY = os.getenv("SECRET_KEY", "kepha")

# JWT algorithm
ALGORITHM = "HS256"

# Token expiration time in minutes
ACCESS_TOKEN_EXPIRE_MINUTES = 60
