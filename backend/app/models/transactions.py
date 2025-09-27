from sqlalchemy import Column, Integer, String, Numeric, Date, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import text
from app.database import Base

class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, index=True)
    date = Column(Date)
    description = Column(String)
    debit = Column(Numeric(12, 2))
    credit = Column(Numeric(12, 2))
    amount = Column(Numeric(12, 2))


class ERPTransaction(Base):
    __tablename__ = "erp_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, index=True)
    date = Column(Date)
    description = Column(String)
    debit = Column(Numeric(12, 2))
    credit = Column(Numeric(12, 2))
    amount = Column(Numeric(12, 2))


class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"

    id = Column(Integer, primary_key=True, index=True)
    results = Column(JSONB)  # stores matches/unmatched sets
    created_at = Column(Date, server_default=text("CURRENT_DATE"))
