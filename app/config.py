# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

# Use the Render Postgres URL as default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://admin_user:mJ0T4oty2ZriDezQc44jnFCd59VpskEI@dpg-d4fmhjchg0os73947in0-a.oregon-postgres.render.com/reconciliator_db"
)

SECRET_KEY = os.getenv("SECRET_KEY", "kepha")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
