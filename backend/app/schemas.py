# app/schemas.py
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime


# =========================================================
# Transaction Schemas
# =========================================================
class TransactionBase(BaseModel):
    id: Optional[int]
    reference: Optional[str]
    description: Optional[str]
    amount: Optional[float]
    date: Optional[date]

    class Config:
        orm_mode = True
        json_encoders = {date: lambda v: v.isoformat() if v else None}


# =========================================================
# Reconciliation Schemas
# =========================================================
class ReconciliationRecord(BaseModel):
    id: Optional[int]
    bank_reference: Optional[str]
    erp_reference: Optional[str]
    amount: Optional[float]
    date: Optional[date]

    class Config:
        orm_mode = True
        json_encoders = {date: lambda v: v.isoformat() if v else None}


class ReconciliationResponse(BaseModel):
    matched: List[ReconciliationRecord]
    unmatched_bank: List[ReconciliationRecord]
    unmatched_erp: List[ReconciliationRecord]
