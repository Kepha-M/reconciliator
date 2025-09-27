from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class TransactionBase(BaseModel):
    transaction_id: Optional[str]
    date: Optional[date]
    description: Optional[str]
    debit: Optional[float]
    credit: Optional[float]
    amount: Optional[float]

    model_config = {
        "from_attributes": True,  # required for from_orm in Pydantic v2
    }

# Nested match schema for reconciliation
class TransactionMatch(BaseModel):
    bank: TransactionBase
    erp: TransactionBase

# Response model for reconciliation results
class ReconciliationResponse(BaseModel):
    matches: List[TransactionMatch]
    unmatched_bank: List[TransactionBase]
    unmatched_erp: List[TransactionBase]
