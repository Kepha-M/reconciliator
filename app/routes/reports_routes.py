# app/api/routes_reports.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from app.database import get_db
from app.utils.report_service import generate_csv_report, generate_excel_report, generate_pdf_report
#for PDF generation
import io  
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors 
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from app.models.models  import BankRecord
import pandas as pd

router = APIRouter()

@router.get("/export-csv")
def export_csv(upload_id: str, db: Session = Depends(get_db)):
    try:
        output = generate_csv_report(upload_id, db)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=reconciliation_report.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export-excel")
def export_excel(upload_id: str, db: Session = Depends(get_db)):
    try:
        output = generate_excel_report(upload_id, db)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=reconciliation_report.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export-pdf")

def export_pdf(upload_id: str, db: Session = Depends(get_db)):

    try:
        # ✅ 2️⃣ Generate the PDF
        output = generate_pdf_report(str(upload_id), db)

        # ✅ 3️⃣ Return the file as a stream response
        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=reconciliation_report_{upload_id}.pdf"
            },
        )

    except Exception as e:
        # ✅ 4️⃣ Graceful error handling
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {str(e)}",
        )