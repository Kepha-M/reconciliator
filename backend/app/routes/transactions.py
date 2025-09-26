# Placeholder for transaction-related routes
from fastapi import APIRouter

router = APIRouter()

@router.get("/transactions")
def get_transactions():
    return [{"date": "2025-09-22", "account": "Bank A", "amount": 500, "reference": "INV-001", "status": "Matched"}]
