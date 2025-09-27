from fastapi import FastAPI
from app.routes import upload, reconciliation
from app.database import Base, engine

app = FastAPI()

# Create DB tables
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(reconciliation.router, prefix="/api", tags=["Reconciliation"])
