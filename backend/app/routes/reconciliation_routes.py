import uuid
from uuid import UUID
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO
from pydantic import BaseModel

from app.database import get_db
from app.models import ERPTransaction, BankUpload
from app.utils.reconciliation_logic import perform_reconciliation

from datetime import datetime
from rapidfuzz import fuzz, process
from app.models.models import BankRecord, MasterRecord, ReconciliationResult
router = APIRouter()

class BankRecordUpdate(BaseModel):
    transaction_id: str | None = None
    description: str | None = None
    amount: float | None = None
    date: str | None = None

@router.post("/upload-bank-file")
async def upload_bank_file(bank_file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Uploads a bank file (CSV/XLSX), parses it, saves to staging (bank_uploads),
    and returns the upload_id for frontend tracking.
    """

    if not bank_file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Invalid file format. Upload CSV or Excel.")

    try:
        content = await bank_file.read()
        if bank_file.filename.endswith(".csv"):
            df = pd.read_csv(BytesIO(content))
        else:
            df = pd.read_excel(BytesIO(content))

        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or unreadable.")

        required_cols = {"TransactionID", "Amount", "Date"}
        if not required_cols.issubset(df.columns):
            raise HTTPException(status_code=400, detail=f"Missing required columns: {required_cols - set(df.columns)}")

        upload_id = str(uuid.uuid4())

        # Store parsed records in the staging table
        for _, row in df.iterrows():
            record = BankUpload(
                upload_id=upload_id,
                transaction_id=str(row["TransactionID"]),
                description=str(row.get("Description", "")),
                amount=float(row["Amount"]),
                date=pd.to_datetime(row["Date"]).date(),
            )
            db.add(record)
        db.commit()

        # Return upload_id for further actions
        records = db.query(BankUpload).filter(BankUpload.upload_id == upload_id).all()

        return {
            "status": "success",
            "upload_id": upload_id,
            "record_count": len(records),
            "records": [
                {
                    "id": r.id,
                    "TransactionID": r.transaction_id,
                    "Description": r.description,
                    "Amount": r.amount,
                    "Date": str(r.date)
                }
                for r in records
            ]
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# @router.post("/reconcile-bank-records/{upload_id}")
# async def reconcile_bank_records(upload_id: str, db: Session = Depends(get_db)):
#     """
#     Reconciles finalized uploaded bank records with ERP transactions.
#     """

#     try:
#         staged_records = db.query(BankUpload).filter(BankUpload.upload_id == upload_id).all()
#         if not staged_records:
#             raise HTTPException(status_code=404, detail="No records found for this upload_id.")

#         bank_df = pd.DataFrame(
#             [
#                 {
#                     "TransactionID": r.transaction_id,
#                     "Amount": r.amount,
#                     "Date": r.date,
#                     "Description": r.description
#                 }
#                 for r in staged_records
#             ]
#         )

#         erp_records = db.query(ERPTransaction).all()
#         if not erp_records:
#             raise HTTPException(status_code=404, detail="No ERP transactions found.")

#         erp_df = pd.DataFrame(
#             [
#                 {
#                     "TransactionID": e.transaction_id,
#                     "Amount": e.amount,
#                     "Date": e.date
#                 }
#                 for e in erp_records
#             ]
#         )

#         results = perform_reconciliation(bank_df, db)

#         return {
#             "status": "success",
#             "upload_id": upload_id,
#             "records_compared": len(results),
#             "transactions": results
#         }

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Reconciliation failed: {str(e)}")

@router.delete("/delete-bank-record/{record_id}")
async def delete_bank_record(record_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific bank record from temporary uploads before reconciliation.
    """
    # Fetch the record
    record = db.query(BankUpload).filter(BankUpload.id == record_id).first()

    if not record:
        raise HTTPException(status_code=404, detail=f"Record with ID {record_id} not found.")

    # Delete the record
    db.delete(record)
    db.commit()

    return {"status": "success", "message": f"Record {record_id} deleted successfully."}

@router.post("/run/{upload_id}")
def run_reconciliation(upload_id:UUID, db: Session = Depends(get_db)):
    """
    Reconcile uploaded bank transactions against master ERP records
    using fuzzy string and numeric matching.
    """

    # ✅ 1. Fetch uploaded transactions
    bank_records = db.query(BankRecord).filter(BankRecord.upload_id == upload_id).all()
    if not bank_records:
        raise HTTPException(status_code=404, detail="No uploaded bank records found.")

    # ✅ 2. Fetch master ERP records
    master_records = db.query(MasterRecord).all()
    if not master_records:
        raise HTTPException(status_code=404, detail="No master ERP records available for reconciliation.")

    results = []
    match_threshold = 85  # Minimum fuzzy similarity score to consider a match

    # ✅ 3. Iterate through bank transactions
    for bank_txn in bank_records:
        best_match = None
        best_score = 0

        # Compare against master records using fuzzy logic
        for master_txn in master_records:
            desc_score = fuzz.token_sort_ratio(
                str(bank_txn.description).lower(), str(master_txn.description).lower()
            )
            amount_match = abs(bank_txn.amount - master_txn.amount) < 1.0  # Numeric tolerance
            date_match = abs((bank_txn.date - master_txn.date).days) <= 2   # Date proximity check

            # Combined weighted score
            composite_score = (desc_score * 0.7) + (90 if amount_match else 0) + (40 if date_match else 0)

            if composite_score > best_score:
                best_score = composite_score
                best_match = master_txn

        # ✅ 4. Determine match result
        if best_score >= match_threshold:
            status = "Matched"
            matched_master_id = best_match.id
        else:
            status = "Unmatched"
            matched_master_id = None

        # ✅ 5. Save or update reconciliation result
        result = ReconciliationResult(
            bank_record_id=bank_txn.id,
            matched_master_id=matched_master_id,
            match_score=round(best_score, 2),
            status=status,
            reconciled_at=datetime.utcnow(),
        )
        db.add(result)
        results.append(result)

    db.commit()

    # ✅ 6. Return summary
    matched_count = len([r for r in results if r.status == "Matched"])
    unmatched_count = len([r for r in results if r.status == "Unmatched"])

    return {
        "upload_id": upload_id,
        "records_compared": len(bank_records),
        "matched": matched_count,
        "unmatched": unmatched_count,
        "timestamp": datetime.utcnow(),
    }