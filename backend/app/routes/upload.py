from fastapi import APIRouter, UploadFile, File, Depends
import pandas as pd
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transactions import BankTransaction, ERPTransaction

router = APIRouter()

@router.post("/upload-files")
async def upload_files(
    bank_file: UploadFile = File(...),
    erp_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    results = {}

    # --- Process Bank File ---
    if bank_file.filename.endswith(".csv"):
        bank_df = pd.read_csv(bank_file.file)
    elif bank_file.filename.endswith((".xls", ".xlsx")):
        bank_df = pd.read_excel(bank_file.file)
    else:
        return {"error": "Unsupported bank file format"}

    for _, row in bank_df.iterrows():
        db.add(BankTransaction(
            transaction_id=str(row.get("TransactionID")),
            date=row.get("Date"),
            description=row.get("Description"),
            debit=row.get("Debit"),
            credit=row.get("Credit"),
            amount=row.get("Amount"),
        ))
    db.commit()
    results["bank_rows"] = len(bank_df)

    # --- Process ERP File ---
    if erp_file.filename.endswith(".csv"):
        erp_df = pd.read_csv(erp_file.file)
    elif erp_file.filename.endswith((".xls", ".xlsx")):
        erp_df = pd.read_excel(erp_file.file)
    else:
        return {"error": "Unsupported ERP file format"}

    for _, row in erp_df.iterrows():
        db.add(ERPTransaction(
            transaction_id=str(row.get("TransactionID")),
            date=row.get("Date"),
            description=row.get("Description"),
            debit=row.get("Debit"),
            credit=row.get("Credit"),
            amount=row.get("Amount"),
        ))
    db.commit()
    results["erp_rows"] = len(erp_df)

    return {"message": "Files uploaded successfully", **results}