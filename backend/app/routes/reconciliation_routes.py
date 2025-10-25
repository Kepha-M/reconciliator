from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO

from app.database import get_db
from app.models import ERPTransaction
from app.utils.reconciliation_logic import perform_reconciliation

router = APIRouter()

@router.post("/reconcile-bank-file")
async def reconcile_bank_file(bank_file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload bank transactions file, compare with ERP DB records, and return reconciliation results.
    """

    # ✅ Step 1: Validate file type
    if not bank_file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Invalid file format. Upload a CSV or Excel file.")

    try:
        # ✅ Step 2: Parse uploaded file into DataFrame
        content = await bank_file.read()
        if bank_file.filename.endswith(".csv"):
            bank_df = pd.read_csv(BytesIO(content))
        else:
            bank_df = pd.read_excel(BytesIO(content))

        if bank_df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or unreadable.")

        # ✅ Step 3: Fetch ERP data from DB
        erp_records = db.query(ERPTransaction).all()
        print("✅ ERP Records Retrieved:", erp_records)
        if not erp_records:
            raise HTTPException(status_code=404, detail="No ERP transactions found in database.")

        erp_df = pd.DataFrame(
            [
                {
                    "TransactionID": erp.transaction_id,
                    "Amount": erp.amount,
                    "Date": erp.date
                }
                for erp in erp_records
            ]
        )

        # ✅ Step 4: Perform reconciliation
        results = perform_reconciliation(bank_df, db)

        # ✅ Step 5: Return structured response
        return {
            "status": "success",
            "records_compared": len(results),
            "transactions": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
