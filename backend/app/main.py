from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload, reconciliation, transactions
from app.database import Base, engine

app = FastAPI(title="Reconciliator API")

# -------------------------
# Enable CORS (frontend origin)
# -------------------------
origins = [
    "http://localhost:5173",  # your React frontend
    "http://127.0.0.1:5173",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Only allow your frontend
    allow_credentials=True,      # Keep True if using cookies/auth
    allow_methods=["*"],         # Allow all HTTP methods
    allow_headers=["*"],         # Allow all headers
)

# -------------------------
# Create DB tables
# -------------------------
Base.metadata.create_all(bind=engine)

# -------------------------
# Include routers
# -------------------------
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(reconciliation.router, prefix="/api", tags=["Reconciliation"])
app.include_router(transactions.router, prefix="/api", tags=["Transactions"])
