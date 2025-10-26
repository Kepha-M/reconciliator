# app/models/models.py
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import JSONB
import enum
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID

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

class BankUpload(Base):
    __tablename__ = "bank_uploads"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(String, index=True)  # unique batch identifier
    transaction_id = Column(String, nullable=False)
    description = Column(String)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    uploaded_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class BankRecord(Base):
    __tablename__ = "bank_records"
    __table_args__ = {"extend_existing": True}
    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False)
    transaction_id = Column(String)
    description = Column(String)
    amount = Column(Float)
    date = Column(Date)

class MasterRecord(Base):
    __tablename__ = "master_records"
    __table_args__ = {"extend_existing": True}
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String)
    description = Column(String)
    amount = Column(Float)
    date = Column(Date)