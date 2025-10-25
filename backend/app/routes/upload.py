# app/routes/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import ReconciliationResult
import pandas as pd
import io

router = APIRouter()

@router.post("/upload-file/")
async def upload_file(
    bank_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        # --- Validate file format ---
        if not bank_file.filename.endswith((".xlsx", ".xls", ".csv")):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {bank_file.filename}. Use Excel or CSV."
            )

        # --- Read file content ---
        file_content = await bank_file.read()
        buffer = io.BytesIO(file_content)

        # Try Excel first, fallback to CSV
        try:
            df = pd.read_excel(buffer, engine="openpyxl")
        except Exception:
            buffer.seek(0)
            df = pd.read_csv(buffer)

        # --- Normalize column names ---
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        # --- Mock reconciliation logic: add status column ---
        # Example logic: if 'amount' > 0 -> "Matched", else -> "Unmatched"
        # if "balance" in df.columns:
        #     df["status"] = df["balance"].apply(lambda x: "Matched" if x > 0 else "Unmatched")
        # else:
        #     df["status"] = "Unverified"

        # --- Store summarized results (optional) ---
        for _, row in df.iterrows():
            result = ReconciliationResult(
                result_type="bank",   # ✅ use a valid enum value here
                bank_reference=str(row.get("reference", "")),
                erp_reference=None,
                date=row.get("date"),
                amount=row.get("amount"),
            )

            db.add(result)
        db.commit()

        # --- Return data for table rendering ---
        data = df.to_dict(orient="records")
        return {"message": "File processed successfully", "transactions": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
