from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transactions import BankTransaction, ERPTransaction
from app.schemas import TransactionBase  # Base Pydantic schema with orm_mode=True

router = APIRouter()

# Fetch all bank transactions
@router.get("/transactions-bank", response_model=list[TransactionBase])
def get_bank_transactions(db: Session = Depends(get_db)):
    transactions = db.query(BankTransaction).order_by(BankTransaction.date.desc()).all()
    return transactions  # FastAPI + Pydantic will serialize automatically

# Fetch all ERP transactions
@router.get("/transactions-erp", response_model=list[TransactionBase])
def get_erp_transactions(db: Session = Depends(get_db)):
    transactions = db.query(ERPTransaction).order_by(ERPTransaction.date.desc()).all()
    return transactions
