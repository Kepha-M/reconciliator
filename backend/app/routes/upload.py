from fastapi import APIRouter, UploadFile, File, Depends
import pandas as pd
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.transactions import BankTransaction, ERPTransaction

router = APIRouter()

@router.post("/upload-bank")
async def upload_bank(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.filename.endswith(".csv"):
        df = pd.read_csv(file.file)
    elif file.filename.endswith((".xls", ".xlsx")):
        df = pd.read_excel(file.file)
    else:
        return {"error": "Unsupported file format"}

    for _, row in df.iterrows():
        db.add(BankTransaction(
            transaction_id=str(row.get("TransactionID")),
            date=row.get("Date"),
            description=row.get("Description"),
            debit=row.get("Debit"),
            credit=row.get("Credit"),
            amount=row.get("Amount"),
        ))
    db.commit()

    return {"message": "Bank data uploaded", "rows": len(df)}


@router.post("/upload-erp")
async def upload_erp(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.filename.endswith(".csv"):
        df = pd.read_csv(file.file)
    elif file.filename.endswith((".xls", ".xlsx")):
        df = pd.read_excel(file.file)
    else:
        return {"error": "Unsupported file format"}

    for _, row in df.iterrows():
        db.add(ERPTransaction(
            transaction_id=str(row.get("TransactionID")),
            date=row.get("Date"),
            description=row.get("Description"),
            debit=row.get("Debit"),
            credit=row.get("Credit"),
            amount=row.get("Amount"),
        ))
    db.commit()

    return {"message": "ERP data uploaded", "rows": len(df)}
