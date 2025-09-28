# app/routes/reconciliation.py
from fastapi import APIRouter, Depends, HTTPException, Body 
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import ReconciliationResult,ResultType
from app.schemas import TransactionBase, ReconciliationResponse

router = APIRouter()
import pandas as pd
from datetime import date

def serialize_transaction(tx: TransactionBase) -> dict:
    """Convert Pydantic TransactionBase to dict and serialize date."""
    d = tx.dict()
    if isinstance(d.get("date"), date):
        d["date"] = d["date"].isoformat()
    return d


#     # Fetch all transactions
#     bank_transactions = db.query(BankTransaction).all()
#     erp_transactions = db.query(ERPTransaction).all()

#     # Convert ORM objects to Pydantic dicts
#     unmatched_bank = [serialize_transaction(TransactionBase.from_orm(b)) for b in bank_transactions]
#     unmatched_erp = [serialize_transaction(TransactionBase.from_orm(e)) for e in erp_transactions]
#     matches = []

#     # Reconciliation logic
#     for b in bank_transactions:
#         for e in erp_transactions:
#             if b.amount == e.amount and b.date == e.date:
#                 bank_dict = serialize_transaction(TransactionBase.from_orm(b))
#                 erp_dict = serialize_transaction(TransactionBase.from_orm(e))
#                 matches.append({"bank": bank_dict, "erp": erp_dict})

#                 # Remove matched items from unmatched lists
#                 unmatched_bank = [
#                     t for t in unmatched_bank
#                     if not (t["transaction_id"] == b.transaction_id and t["date"] == str(b.date))
#                 ]
#                 unmatched_erp = [
#                     t for t in unmatched_erp
#                     if not (t["transaction_id"] == e.transaction_id and t["date"] == str(e.date))
#                 ]
#                 break  # stop after first match for this bank transaction

#     # Build results dictionary
#     results = {
#         "matches": matches,
#         "unmatched_bank": unmatched_bank,
#         "unmatched_erp": unmatched_erp
#     }

#     # Save to database
#     rec = ReconciliationResult(results=results)
#     db.add(rec)
#     db.commit()
#     db.refresh(rec)

#     return results
@router.post("/reconciliation")
def run_reconciliation(
    payload: dict = Body(...),  # Accept raw JSON from frontend
    db: Session = Depends(get_db)
):
    # Convert JSON arrays to DataFrames
    bank_data = pd.DataFrame(payload.get("bank_data", []))
    erp_data = pd.DataFrame(payload.get("erp_data", []))

    # Convert date strings to actual date objects
    for df in [bank_data, erp_data]:
        if "Date" in df.columns:
            df["Date"] = pd.to_datetime(df["Date"], errors="coerce").dt.date
        elif "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date

    # Basic matching: Amount + Date
    matched = pd.merge(
        bank_data, erp_data,
        left_on=["Amount", "Date"],
        right_on=["Amount", "Date"],
        how="inner",
        suffixes=("_bank", "_erp")
    )
    unmatched_bank = bank_data[~bank_data.index.isin(matched.index)]
    unmatched_erp = erp_data[~erp_data.index.isin(matched.index)]

    # Store results in DB
    for _, row in matched.iterrows():
        db.add(ReconciliationResult(
            result_type=ResultType.matched,
            bank_reference=row.get("TransactionID") or row.get("transaction_id"),
            erp_reference=row.get("VoucherNo") or row.get("voucherNo"),
            amount=row["Amount"],
            date=row["Date"]
        ))
    for _, row in unmatched_bank.iterrows():
        db.add(ReconciliationResult(
            result_type=ResultType.unmatched_bank,
            bank_reference=row.get("TransactionID") or row.get("transaction_id"),
            amount=row["Amount"],
            date=row["Date"]
        ))
    for _, row in unmatched_erp.iterrows():
        db.add(ReconciliationResult(
            result_type=ResultType.unmatched_erp,
            erp_reference=row.get("VoucherNo") or row.get("voucherNo"),
            amount=row["Amount"],
            date=row["Date"]
        )) 

    db.commit()

    # Return results to frontend
    return {
        "matched": matched.to_dict(orient="records"),
        "unmatched_bank": unmatched_bank.to_dict(orient="records"),
        "unmatched_erp": unmatched_erp.to_dict(orient="records")
    }

# @router.get("/reconciliation-results")
# def get_results(db: Session = Depends(get_db)):
#     results = db.query(ReconciliationResult).all()
#     return [dict(
#         id=r.id,
#         result_type=r.result_type.value,
#         bank_reference=r.bank_reference,
#         erp_reference=r.erp_reference,
#         amount=r.amount,
#         date=r.date
#     ) for r in results]

@router.get("/reconciliation-results")
def get_results(db: Session = Depends(get_db)):
    results = db.query(ReconciliationResult).all()

    response = {
        "matches": [],
        "unmatched_bank": [],
        "unmatched_erp": [],
    }

    for r in results:
        item = {
            "id": r.id,
            "bank_reference": r.bank_reference,
            "erp_reference": r.erp_reference,
            "amount": r.amount,
            "date": r.date,
        }

        if r.result_type.value == "matched":
            response["matches"].append(item)
        elif r.result_type.value == "unmatched_bank":
            response["unmatched_bank"].append(item)
        elif r.result_type.value == "unmatched_erp":
            response["unmatched_erp"].append(item)

    return response
