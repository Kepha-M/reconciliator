# app/routes/reconciliation.py
import uuid
from uuid import UUID
from datetime import datetime
from io import BytesIO, StringIO
import io

from fastapi.responses import StreamingResponse
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle



from app.database import get_db
from app.models.models import BankRecord, ReconciliationResult
from app.utils.reconciliation_logic import reconcile_bank_records
from app.auth.dependencies import require_role

router = APIRouter()

# ============================================================
# CONFIG
# ============================================================
SUPPORTED_TYPES = ["bank", "supplier", "customer", "general"]

RECON_MODELS = {
    "bank": BankRecord,
    # Add other types as needed
}

RECON_ENGINES = {
    "bank": reconcile_bank_records,
    # Add other types as needed
}

# ============================================================
# SCHEMAS
# ============================================================
class RecordUpdate(BaseModel):
    transaction_id: str | None = None
    description: str | None = None
    amount: float | None = None
    date: str | None = None

# ============================================================
# VALIDATION
# ============================================================
def validate_recon_type(recon_type: str):
    if recon_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid reconciliation type '{recon_type}'. Allowed: {SUPPORTED_TYPES}"
        )
    return recon_type

# ============================================================
# UPLOAD FILE
# ============================================================
@router.post("/{recon_type}/upload-file", status_code=201)
async def upload_file(
    recon_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("user"))
):
    recon_type = validate_recon_type(recon_type)

    if recon_type not in RECON_MODELS:
        raise HTTPException(status_code=501, detail="Reconciliation type not implemented.")

    if not file.filename.endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Upload CSV or Excel format only.")

    content = await file.read()
    df = pd.read_csv(BytesIO(content)) if file.filename.endswith(".csv") else pd.read_excel(BytesIO(content))

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    required_cols = {"TransactionID", "Amount", "Date"}
    if not required_cols.issubset(df.columns):
        missing = required_cols - set(df.columns)
        raise HTTPException(status_code=400, detail=f"Missing required columns: {missing}")

    upload_id = str(uuid.uuid4())
    Model = RECON_MODELS[recon_type]

    # Store records
    try:
        for _, row in df.iterrows():
            record = Model(
                upload_id=upload_id,
                transaction_id=str(row["TransactionID"]),
                description=str(row.get("Description", "")),
                amount=float(row["Amount"]),
                date=pd.to_datetime(row["Date"]).date(),
                status="Pending",
            )
            db.add(record)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving records: {str(e)}")

    # Run reconciliation
    engine = RECON_ENGINES.get(recon_type)
    if not engine:
        raise HTTPException(status_code=501, detail=f"No reconciliation logic for '{recon_type}'")

    summary = engine(db, upload_id)
    records = db.query(Model).filter(Model.upload_id == upload_id).all()

    return {
        "upload_id": upload_id,
        "recon_type": recon_type,
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
        "summary": summary["summary"],
        "details": summary["details"],
    }

# ============================================================
# DELETE RECORD
# ============================================================
@router.delete("/{recon_type}/delete-record/{record_id}")
async def delete_record(
    recon_type: str,
    record_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):
    recon_type = validate_recon_type(recon_type)
    if recon_type not in RECON_MODELS:
        raise HTTPException(status_code=501, detail="Not implemented.")

    Model = RECON_MODELS[recon_type]
    record = db.query(Model).filter(Model.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Record {record_id} not found.")

    db.delete(record)
    db.commit()
    return {"status": "success", "message": f"Record {record_id} deleted."}

# ============================================================
# RUN RECONCILIATION
# ============================================================
@router.post("/{recon_type}/run/{upload_id}")
def run_reconciliation(
    recon_type: str,
    upload_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "analyst"))
):
    recon_type = validate_recon_type(recon_type)
    Model = RECON_MODELS.get(recon_type)
    engine = RECON_ENGINES.get(recon_type)

    if not Model or not engine:
        raise HTTPException(status_code=501, detail="Not implemented.")

    records = db.query(Model).filter(Model.upload_id == str(upload_id)).all()
    if not records:
        raise HTTPException(status_code=404, detail="No records found for this upload ID.")

    summary = engine(db, str(upload_id))
    return {
        "status": "success",
        "recon_type": recon_type,
        "upload_id": str(upload_id),
        "summary": summary["summary"],
        "details": summary["details"],
    }

# ============================================================
# EXPORT DATA (CSV, Excel, PDF)
# ============================================================
@router.get("/{recon_type}/export")
def export_data(
    recon_type: str,
    upload_id: str = Query(...),
    format: str = Query("csv"),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("user"))
):
    recon_type = validate_recon_type(recon_type)
    Model = RECON_MODELS.get(recon_type)
    if not Model:
        raise HTTPException(status_code=501, detail="Not implemented.")

    records = db.query(Model).filter(Model.upload_id == upload_id).all()
    if not records:
        raise HTTPException(status_code=404, detail="No records found.")

    data = [
        {
            "TransactionID": r.transaction_id,
            "Description": getattr(r, "description", ""),
            "Amount": r.amount,
            "Date": r.date.strftime("%Y-%m-%d"),
            "Status": r.status,
        }
        for r in records
    ]

    # ---------------- CSV ----------------
    if format.lower() == "csv":
        stream = StringIO()
        pd.DataFrame(data).to_csv(stream, index=False, encoding="utf-8-sig")
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={recon_type}_{upload_id}.csv"}
        )

    # ---------------- Excel ----------------
    elif format.lower() in ["excel", "xlsx"]:
        stream = BytesIO()
        with pd.ExcelWriter(stream, engine="xlsxwriter") as writer:
            pd.DataFrame(data).to_excel(writer, index=False, sheet_name="Records")
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={recon_type}_{upload_id}.xlsx"}
        )

    # ---------------- PDF ----------------
    elif format.lower() == "pdf":
        stream = BytesIO()
        doc = SimpleDocTemplate(stream, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

    # --- Add header info ---
    export_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    username = getattr(current_user, "username", "Unknown")  # or pass from dependency
    title = f"{recon_type.capitalize()} Reconciliation Results"
    reference = f"Upload Reference ID: {upload_id}"

    elements.append(Paragraph(title, styles['Title']))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"Exported by: {username}", styles['Normal']))
    elements.append(Paragraph(f"Date of export: {export_date}", styles['Normal']))
    elements.append(Paragraph(reference, styles['Normal']))
    elements.append(Spacer(1, 12))

    # --- Table data ---
    table_data = [["TransactionID", "Description", "Amount", "Date", "Status"]] + [
        [r["TransactionID"], r["Description"], str(r["Amount"]), r["Date"], r["Status"]] for r in data
    ]

    table = Table(table_data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
    ]))

    elements.append(table)
    doc.build(elements)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={recon_type}_{upload_id}.pdf"}
    )

  