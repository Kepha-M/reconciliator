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

    class Config:
        orm_mode = True


class BankTransactionCreate(TransactionBase):
    pass


class ERPTransactionCreate(TransactionBase):
    pass


class ReconciliationResponse(BaseModel):
    matches: list
    unmatched_bank: list
    unmatched_erp: list
