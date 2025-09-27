from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transactions import BankTransaction, ERPTransaction, ReconciliationResult
from app.schemas import ReconciliationResponse
from datetime import datetime

router = APIRouter()

@router.post("/reconcile", response_model=ReconciliationResponse)
def reconcile(db: Session = Depends(get_db)):
    bank = db.query(BankTransaction).all()
    erp = db.query(ERPTransaction).all()

    matches = []
    unmatched_bank = [b.__dict__ for b in bank]
    unmatched_erp = [e.__dict__ for e in erp]

    for b in bank:
        for e in erp:
            if b.amount == e.amount and b.date == e.date:
                matches.append({"bank": b.__dict__, "erp": e.__dict__})
                if b.__dict__ in unmatched_bank:
                    unmatched_bank.remove(b.__dict__)
                if e.__dict__ in unmatched_erp:
                    unmatched_erp.remove(e.__dict__)
                break

    results = {
        "matches": matches,
        "unmatched_bank": unmatched_bank,
        "unmatched_erp": unmatched_erp,
    }

    rec = ReconciliationResult(results=results)
    db.add(rec)
    db.commit()

    return results


@router.get("/reconciliation-history")
def history(db: Session = Depends(get_db)):
    return db.query(ReconciliationResult).all()
