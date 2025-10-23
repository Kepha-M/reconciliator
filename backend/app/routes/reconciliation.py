# app/routes/reconciliation.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ReconciliationResult, ResultType
from app.schemas import ReconciliationResponse
from datetime import datetime
import pandas as pd
import os
import logging

# Initialize router
router = APIRouter()

# Logger
logger = logging.getLogger(__name__)

# Directory where uploaded files are temporarily stored
UPLOAD_DIR = "uploaded_data"
BANK_FILE_PATH = os.path.join(UPLOAD_DIR, "bank_data.xlsx")
ERP_FILE_PATH = os.path.join(UPLOAD_DIR, "erp_data.xlsx")


@router.post("/reconciliation", response_model=ReconciliationResponse)
def run_reconciliation(db: Session = Depends(get_db)):
    """
    Perform reconciliation between uploaded bank and ERP data files.
    Matching is based on Amount + Date.
    Results are saved in the database and returned to the frontend.
    """
    try:
        # --- Validate existence of uploaded files ---
        if not os.path.exists(BANK_FILE_PATH) or not os.path.exists(ERP_FILE_PATH):
            raise HTTPException(
                status_code=400,
                detail="Missing uploaded files. Please upload both bank and ERP data before reconciliation."
            )

        # --- Load DataFrames ---
        bank_df = pd.read_excel(BANK_FILE_PATH)
        erp_df = pd.read_excel(ERP_FILE_PATH)

        # --- Normalize column names for consistency ---
        bank_df.columns = bank_df.columns.str.strip().str.lower()
        erp_df.columns = erp_df.columns.str.strip().str.lower()

        # --- Validate required columns ---
        required_cols = ["amount", "date"]
        for col in required_cols:
            if col not in bank_df.columns or col not in erp_df.columns:
                raise HTTPException(
                    status_code=400,
                    detail=f"Both files must contain '{col}' column."
                )

        # --- Convert dates ---
        for df in [bank_df, erp_df]:
            df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date

        # --- Perform Matching (Amount + Date) ---
        matched = pd.merge(
            bank_df, erp_df,
            on=["amount", "date"],
            how="inner",
            suffixes=("_bank", "_erp")
        )

        # --- Identify unmatched records ---
        unmatched_bank = bank_df.merge(matched, on=["amount", "date"], how="left", indicator=True)
        unmatched_bank = unmatched_bank[unmatched_bank["_merge"] == "left_only"].drop(columns=["_merge"])

        unmatched_erp = erp_df.merge(matched, on=["amount", "date"], how="left", indicator=True)
        unmatched_erp = unmatched_erp[unmatched_erp["_merge"] == "left_only"].drop(columns=["_merge"])

        # --- Clear previous reconciliation results ---
        db.query(ReconciliationResult).delete()

        # --- Insert Matched Records ---
        for _, row in matched.iterrows():
            db.add(ReconciliationResult(
                result_type=ResultType.matched,
                bank_reference=row.get("transactionid") or row.get("transaction_id"),
                erp_reference=row.get("voucherno") or row.get("voucher_no"),
                amount=row["amount"],
                date=row["date"]
            ))

        # --- Insert Unmatched Bank Records ---
        for _, row in unmatched_bank.iterrows():
            db.add(ReconciliationResult(
                result_type=ResultType.unmatched_bank,
                bank_reference=row.get("transactionid") or row.get("transaction_id"),
                amount=row["amount"],
                date=row["date"]
            ))

        # --- Insert Unmatched ERP Records ---
        for _, row in unmatched_erp.iterrows():
            db.add(ReconciliationResult(
                result_type=ResultType.unmatched_erp,
                erp_reference=row.get("voucherno") or row.get("voucher_no"),
                amount=row["amount"],
                date=row["date"]
            ))

        # --- Commit results to DB ---
        db.commit()
        logger.info("Reconciliation results successfully saved to the database.")

        # --- Return structured response ---
        return ReconciliationResponse(
            matched=matched.to_dict(orient="records"),
            unmatched_bank=unmatched_bank.to_dict(orient="records"),
            unmatched_erp=unmatched_erp.to_dict(orient="records")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reconciliation error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reconciliation failed: {str(e)}")


@router.get("/reconciliation-results")
def get_reconciliation_results(db: Session = Depends(get_db)):
    """
    Retrieve all reconciliation results (matched, unmatched_bank, unmatched_erp)
    from the database.
    """
    try:
        results = db.query(ReconciliationResult).all()

        if not results:
            return {
                "message": "No reconciliation data found. Run a reconciliation first.",
                "matches": [],
                "unmatched_bank": [],
                "unmatched_erp": [],
            }

        response = {
            "matches": [],
            "unmatched_bank": [],
            "unmatched_erp": [],
        }

        for r in results:
            record = {
                "id": r.id,
                "bank_reference": r.bank_reference,
                "erp_reference": r.erp_reference,
                "amount": r.amount,
                "date": r.date.isoformat() if r.date else None,
            }

            if r.result_type == ResultType.matched:
                response["matches"].append(record)
            elif r.result_type == ResultType.unmatched_bank:
                response["unmatched_bank"].append(record)
            elif r.result_type == ResultType.unmatched_erp:
                response["unmatched_erp"].append(record)

        return response

    except Exception as e:
        logger.error(f"Error fetching reconciliation results: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve reconciliation results.")
