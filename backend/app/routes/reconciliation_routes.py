# app/routes/reconciliation.py
import uuid
from uuid import UUID
from datetime import datetime
from io import BytesIO

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from rapidfuzz import fuzz

from app.database import get_db
from app.models.models import BankRecord, MasterRecord, ReconciliationResult
from app.utils.reconciliation_logic import reconcile_bank_records
from app.auth.dependencies import require_role  # RBAC

router = APIRouter()


# ------------------------------------------------------
# Pydantic Schema
# ------------------------------------------------------
class BankRecordUpdate(BaseModel):
    transaction_id: str | None = None
    description: str | None = None
    amount: float | None = None
    date: str | None = None


# ------------------------------------------------------
# Endpoint: Upload Bank File
# ------------------------------------------------------
@router.post("/upload-bank-file", status_code=201) 
async def upload_bank_file(
    bank_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("user"))  # Any user can upload
):
    """
    Upload CSV/XLSX bank file, store records in staging,
    and immediately run reconciliation.
    """
    # Validate file type
    if not bank_file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Upload CSV or Excel."
        )

    try:
        content = await bank_file.read()
        df = (
            pd.read_csv(BytesIO(content))
            if bank_file.filename.endswith(".csv")
            else pd.read_excel(BytesIO(content))
        )

        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or unreadable.")

        required_cols = {"TransactionID", "Amount", "Date"}
        if not required_cols.issubset(df.columns):
            missing = required_cols - set(df.columns)
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing}")

        upload_id = str(uuid.uuid4())

        # Store records in DB
        for idx, row in df.iterrows():
            try:
                record = BankRecord(
                    upload_id=upload_id,
                    transaction_id=str(row["TransactionID"]),
                    description=str(row.get("Description", "")),
                    amount=float(row["Amount"]),
                    date=pd.to_datetime(row["Date"]).date(),
                    status="Pending",
                )
                db.add(record)
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Error processing row {idx + 1}: {str(e)}"
                )

        db.commit()

        # Run reconciliation
        reconciliation_summary = reconcile_bank_records(db, upload_id)

        records = db.query(BankRecord).filter(BankRecord.upload_id == upload_id).all()

        return {
            "upload_id": upload_id,
            "record_count": len(records),
            "records": [
                {
                    "id": r.id,
                    "TransactionID": r.transaction_id,
                    "Description": r.description,
                    "Amount": r.amount,
                    "Date": str(r.date),
                    "Status": r.status,
                }
                for r in records
            ],
            "reconciliation_summary": reconciliation_summary["summary"],
            "reconciliation_details": reconciliation_summary["details"],
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


# ------------------------------------------------------
# Endpoint: Delete Bank Record
# ------------------------------------------------------
@router.delete("/delete-bank-record/{record_id}")
async def delete_bank_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))  # Only admin
):
    """
    Delete a specific bank record before reconciliation.
    """
    record = db.query(BankRecord).filter(BankRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Record {record_id} not found.")

    db.delete(record)
    db.commit()

    return {"status": "success", "message": f"Record {record_id} deleted successfully."}


# ------------------------------------------------------
# Endpoint: Run Reconciliation
# ------------------------------------------------------
@router.post("/run/{upload_id}")
def run_reconciliation(
    upload_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "analyst"))  # Admin & analyst can run
):
    """
    Perform reconciliation between uploaded bank records and master ERP records.
    Uses fuzzy matching and numeric/date tolerance.
    """
    bank_records = db.query(BankRecord).filter(BankRecord.upload_id == str(upload_id)).all()
    if not bank_records:
        raise HTTPException(status_code=404, detail=f"No bank records found for upload_id {upload_id}")

    master_records = db.query(MasterRecord).all()
    if not master_records:
        raise HTTPException(status_code=404, detail="No master ERP records available.")

    results = []
    match_threshold = 85  # composite score threshold

    # Matching logic
    for bank_txn in bank_records:
        best_match = None
        best_score = 0

        for master_txn in master_records:
            desc_score = fuzz.token_sort_ratio(
                str(bank_txn.description).lower(), str(master_txn.description).lower()
            )
            amount_match = abs(bank_txn.amount - master_txn.amount) < 1.0  # tolerance ±1
            date_match = abs((bank_txn.date - master_txn.date).days) <= 2  # ±2 days

            composite_score = (desc_score * 0.7) + (90 if amount_match else 0) + (40 if date_match else 0)

            if composite_score > best_score:
                best_score = composite_score
                best_match = master_txn

        status = "Matched" if best_score >= match_threshold else "Unmatched"
        matched_master_id = best_match.id if best_match and status == "Matched" else None

        bank_txn.status = status
        db.add(bank_txn)

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

    matched_count = len([r for r in results if r.status == "Matched"])
    unmatched_count = len([r for r in results if r.status == "Unmatched"])

    return {
        "status": "success",
        "upload_id": str(upload_id),
        "records_compared": len(bank_records),
        "matched": matched_count,
        "unmatched": unmatched_count,
        "timestamp": datetime.utcnow(),
    }
