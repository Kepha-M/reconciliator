from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Reconciliator API",
    version="1.0.0",
    description="Minimal FastAPI backend ready for Render deployment"
)

# Enable CORS if your frontend is hosted separately
origins = [
    "*",  # or specify frontend URL, e.g., "https://yourfrontend.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check route
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Sample route
@app.get("/")
def root():
    return {"message": "FastAPI backend deployed successfully!"}
