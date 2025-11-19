from sqlalchemy.orm import Session
from datetime import datetime
from app.models.models import BankRecord, MasterRecord, ReconciliationResult


def reconcile_bank_records(db: Session, upload_id: str):
    """
    Performs automatic reconciliation between uploaded bank records and ERP (master) transactions.
    Inserts results into reconciliation_results and returns a structured summary.
    """

    # Fetch records
    bank_records = db.query(BankRecord).filter(BankRecord.upload_id == upload_id).all()
    master_records = db.query(MasterRecord).all()

    if not bank_records:
        return {"message": f"No bank records found for upload_id {upload_id}."}

    matched, unmatched_bank, unmatched_erp = [], [], []

    # Matching logic: match based on amount and date
    for bank in bank_records:
        match = next(
            (
                erp
                for erp in master_records
                if abs(erp.amount - bank.amount) < 0.01 and erp.date == bank.date
            ),
            None,
        )

        if match:
            # Insert reconciliation result
            result = ReconciliationResult(
                bank_record_id=bank.id,
                matched_master_id=match.id,
                match_score=1.0,  # full match
                status="Matched",
                reconciled_at=datetime.utcnow(),
            )
            db.add(result)

            # Update bank record
            bank.status = "Matched"
            matched.append({
                "bank_id": bank.id,
                "bank_ref": bank.transaction_id,
                "erp_ref": match.transaction_id,
                "amount": bank.amount,
                "date": str(bank.date)
            })
        else:
            bank.status = "Unmatched"
            unmatched_bank.append({
                "transaction_id": bank.transaction_id,
                "amount": bank.amount,
                "date": str(bank.date)
            })
        db.add(bank)

    # Identify ERP transactions with no corresponding bank match
    unmatched_erp = [
        {
            "transaction_id": erp.transaction_id,
            "amount": erp.amount,
            "date": str(erp.date)
        }
        for erp in master_records
        if not any(abs(erp.amount - b.amount) < 0.01 and erp.date == b.date for b in bank_records)
    ]

    # Commit all DB changes
    db.commit()

    # Return structured summary for frontend display
    return {
        "summary": {
            "matched": len(matched),
            "unmatched_bank": len(unmatched_bank),
            "unmatched_erp": len(unmatched_erp),
        },
        "details": {
            "matched_records": matched,
            "unmatched_bank_records": unmatched_bank,
            "unmatched_erp_records": unmatched_erp,
        },
    }
