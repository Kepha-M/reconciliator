# models/reconciliation.py
from sqlalchemy import Column, Integer, JSON, DateTime, func
from app.database import Base

class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"
    __table_args__ = {"extend_existing": True} 

    id = Column(Integer, primary_key=True, index=True)
    results = Column(JSON, nullable=False)   # store matches/unmatched as JSON
    created_at = Column(DateTime, server_default=func.now())
