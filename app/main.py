from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routes import upload, transactions, reconciliation_routes, reports_routes

from app.auth.routes import router as auth_router
from app.auth.dependencies import get_current_user
from app.database import Base, engine

app = FastAPI(title="Reconciliator API")

# -------------------------
# Enable CORS (frontend origin)
# -------------------------
origins = [
    "http://localhost:3001",          # Local frontend  
    "https://kepha-m.github.io/reconciliator",  # Deployed frontend
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

app.include_router(auth_router)

@app.get("/secure-data")
def secure_data(user=Depends(get_current_user)):
    return {"message": f"Welcome {user.username}, you have secure access."}

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(transactions.router, prefix="/api", tags=["Transactions"])
app.include_router(reconciliation_routes.router, tags=["Reconciliation Routes"])
app.include_router(reports_routes.router, prefix="/api", tags=["Reports"])

