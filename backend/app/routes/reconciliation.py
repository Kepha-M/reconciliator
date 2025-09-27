# app/routes/reconciliation.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transactions import BankTransaction, ERPTransaction, ReconciliationResult
from app.schemas import TransactionBase, ReconciliationResponse

router = APIRouter()

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transactions import BankTransaction, ERPTransaction
from app.models.reconciliation import ReconciliationResult
from app.schemas import TransactionBase, TransactionMatch, ReconciliationResponse
from datetime import date
router = APIRouter()

def serialize_transaction(tx: TransactionBase) -> dict:
    """Convert Pydantic TransactionBase to dict and serialize date."""
    d = tx.dict()
    if isinstance(d.get("date"), date):
        d["date"] = d["date"].isoformat()
    return d

@router.post("/reconciliation", response_model=ReconciliationResponse)
def reconcile(db: Session = Depends(get_db)):

    # Fetch all transactions
    bank_transactions = db.query(BankTransaction).all()
    erp_transactions = db.query(ERPTransaction).all()

    # Convert ORM objects to Pydantic dicts
    unmatched_bank = [serialize_transaction(TransactionBase.from_orm(b)) for b in bank_transactions]
    unmatched_erp = [serialize_transaction(TransactionBase.from_orm(e)) for e in erp_transactions]
    matches = []

    # Reconciliation logic
    for b in bank_transactions:
        for e in erp_transactions:
            if b.amount == e.amount and b.date == e.date:
                bank_dict = serialize_transaction(TransactionBase.from_orm(b))
                erp_dict = serialize_transaction(TransactionBase.from_orm(e))
                matches.append({"bank": bank_dict, "erp": erp_dict})

                # Remove matched items from unmatched lists
                unmatched_bank = [
                    t for t in unmatched_bank
                    if not (t["transaction_id"] == b.transaction_id and t["date"] == str(b.date))
                ]
                unmatched_erp = [
                    t for t in unmatched_erp
                    if not (t["transaction_id"] == e.transaction_id and t["date"] == str(e.date))
                ]
                break  # stop after first match for this bank transaction

    # Build results dictionary
    results = {
        "matches": matches,
        "unmatched_bank": unmatched_bank,
        "unmatched_erp": unmatched_erp
    }

    # Save to database
    rec = ReconciliationResult(results=results)
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return results

@router.get("/reconciliation-history", response_model=list[ReconciliationResponse])
def history(db: Session = Depends(get_db)):
    # Fetch all saved reconciliation results
    records = db.query(ReconciliationResult).order_by(ReconciliationResult.created_at.desc()).all()
    return [ReconciliationResponse(**r.results) for r in records]
