# app/services/report_service.py

import io
import pandas as pd
from datetime import datetime
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4 
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.styles import getSampleStyleSheet
from app.models.models  import BankRecord

def fetch_reconciliation_data(upload_id: str, db):
    return db.query(BankRecord).filter(BankRecord.upload_id == upload_id).all()


# ✅ CSV EXPORT (trimmed columns)
def generate_csv_report(upload_id: str, db):
    records = fetch_reconciliation_data(upload_id, db)
    df = pd.DataFrame([r.__dict__ for r in records])

    # Keep only the key columns
    key_columns = ["transaction_id", "amount", "status", "description", "date"]
    df = df[key_columns]

    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return io.BytesIO(output.getvalue().encode("utf-8"))


# ✅ EXCEL EXPORT (trimmed columns)
def generate_excel_report(upload_id: str, db):
    records = fetch_reconciliation_data(upload_id, db)
    df = pd.DataFrame([r.__dict__ for r in records])

    # Keep only the key columns
    key_columns = ["transaction_id", "amount", "status", "description", "date"]
    df = df[key_columns]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Reconciliation Report")

    output.seek(0)
    return output



# ✅ PDF EXPORT — Key Columns + Timestamp + Summary
def generate_pdf_report(upload_id: str, db):
    # Fetch records
    records = fetch_reconciliation_data(upload_id, db)

    # Extract only relevant columns
    filtered_data = [
        {
            "transaction_id": r.transaction_id,
            "amount": r.amount,
            "status": r.status,
        }
        for r in records
    ]

    # Handle empty datasets gracefully
    if not filtered_data:
        filtered_data = [{"transaction_id": "-", "amount": "-", "status": "No Data"}]

    # Create DataFrame
    df = pd.DataFrame(filtered_data)

    # === Compute Summary Statistics ===
    total_matched = df[df["status"].str.lower() == "matched"].shape[0]
    total_unmatched = df[df["status"].str.lower() == "unmatched"].shape[0]
    total_amount = df["amount"].apply(pd.to_numeric, errors="coerce").sum()

    # === PDF Setup ===
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=50,
        bottomMargin=30,
    )

    styles = getSampleStyleSheet()
    elements = []

    # === Header Section ===
    # Title
    title_style = ParagraphStyle(
        name="TitleStyle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        spaceAfter=10,
    )

    # Timestamp (top-right)
    timestamp_style = ParagraphStyle(
        name="TimestampStyle",
        parent=styles["Normal"],
        alignment=TA_RIGHT,
        fontSize=9,
        textColor=colors.grey,
    )
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    elements.append(Paragraph(f"Generated on: {current_time}", timestamp_style))
    elements.append(Paragraph("Auto Reconciliation Report", title_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f" Ref.: {upload_id}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    # === Transaction Table ===
    data = [df.columns.tolist()] + df.values.tolist()

    table = Table(data, repeatRows=1)
    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ])
    )

    elements.append(table)
    elements.append(Spacer(1, 20))

    # === Summary Footer ===
    summary_data = [
        ["Total Records", len(df)],
        ["Total Matched", total_matched],
        ["Total Unmatched", total_unmatched],
        ["Total Amount", f"{total_amount:,.2f}"],
    ]

    summary_table = Table(summary_data, colWidths=[150, 150])
    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.gray),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ])
    )

    elements.append(Paragraph("Summary", styles["Heading2"]))
    elements.append(Spacer(1, 6))
    elements.append(summary_table)

    # === Build and Return ===
    doc.build(elements)
    buffer.seek(0)
    return buffer