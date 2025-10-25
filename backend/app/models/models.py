# app/models/models.py
from sqlalchemy import Column, Integer, String, Float, Date, Enum
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import text
import enum

Base = declarative_base()


# --- Reconciliation Result Types ---
class ResultType(str, enum.Enum):
    matched = "matched"
    unmatched_bank = "unmatched_bank"
    unmatched_erp = "unmatched_erp"


# --- Reconciliation Result Model ---
class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    result_type = Column(String(50))  # renamed
    bank_reference = Column(String, nullable=True)
    erp_reference = Column(String, nullable=True)
    date = Column(Date, nullable=True)
    amount = Column(Float, nullable=True)



# --- Bank Transactions Model ---
class BankTransaction(Base):
    __tablename__ = "bank_transactions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, nullable=False)
    date = Column(Date, nullable=True)
    description = Column(String, nullable=True)
    debit = Column(Float, nullable=True)
    credit = Column(Float, nullable=True)
    amount = Column(Float, nullable=True)


# --- ERP Transactions Model ---
class ERPTransaction(Base):
    __tablename__ = "erp_transactions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, nullable=False)
    date = Column(Date, nullable=True)
    description = Column(String, nullable=True)
    debit = Column(Float, nullable=True)
    credit = Column(Float, nullable=True)
    amount = Column(Float, nullable=True)
