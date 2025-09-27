from fastapi import APIRouter
from datetime import datetime
from app import storage

router = APIRouter()

def parse_date(date_str: str):
    """Try to parse date from string into datetime.date"""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return None

@router.post("/reconcile")
def reconcile():
    bank = storage.bank_data
    erp = storage.erp_data

    if not bank or not erp:
        return {"error": "No uploaded data found"}

    matches = []
    unmatched_bank = bank.copy()
    unmatched_erp = erp.copy()

    # Tolerant reconciliation logic
    for b in bank:
        b_date = parse_date(b.get("date"))
        b_amount = float(b.get("amount", 0))

        for e in erp:
            e_date = parse_date(e.get("date"))
            e_amount = float(e.get("amount", 0))

            if not b_date or not e_date:
                continue

            amount_match = abs(abs(b_amount) - abs(e_amount)) < 1.0
            date_match = abs((b_date - e_date).days) <= 1

            if amount_match and date_match:
                matches.append({"bank": b, "erp": e})
                if b in unmatched_bank:
                    unmatched_bank.remove(b)
                if e in unmatched_erp:
                    unmatched_erp.remove(e)
                break

    return {
        "matches": matches,
        "unmatched_bank": unmatched_bank,
        "unmatched_erp": unmatched_erp,
    }
@router.get("/debug-storage")
def debug_storage():
    return {
        "bank_data": storage.bank_data,
        "erp_data": storage.erp_data,
    }