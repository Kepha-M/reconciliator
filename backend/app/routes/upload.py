# app/routes/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import ReconciliationResult
from app.utils.reconciliation_logic import perform_reconciliation
import pandas as pd
import io

router = APIRouter()

@router.post("/upload-files")
async def upload_files(
    bank_file: UploadFile = File(...),
    erp_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        # --- Validate file formats ---
        for f in [bank_file, erp_file]:
            if not f.filename.endswith((".xlsx", ".xls", ".csv")):
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format: {f.filename}. Use Excel or CSV."
                )

        # --- Load Bank File ---
        bank_content = await bank_file.read()
        bank_buffer = io.BytesIO(bank_content)
        try:
            bank_df = pd.read_excel(bank_buffer, engine="openpyxl")
        except Exception:
            bank_buffer.seek(0)
            bank_df = pd.read_csv(bank_buffer)

        # --- Load ERP File ---
        erp_content = await erp_file.read()
        erp_buffer = io.BytesIO(erp_content)
        try:
            erp_df = pd.read_excel(erp_buffer, engine="openpyxl")
        except Exception:
            erp_buffer.seek(0)
            erp_df = pd.read_csv(erp_buffer)

        # --- Perform Reconciliation ---
        results = perform_reconciliation(bank_df, erp_df, db)

        # --- Store Results ---
        for res in results:
            db_result = ReconciliationResult(
                result_type=res["result_type"],
                bank_reference=res.get("bank_reference"),
                erp_reference=res.get("erp_reference"),
                date=res.get("date"),
                amount=res.get("amount"),
            )
            db.add(db_result)
        db.commit()

        return {
            "message": "Files uploaded and reconciled successfully",
             "redirect_url": "/reconciliation"
        }
        

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
