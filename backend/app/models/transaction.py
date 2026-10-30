from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.database.postgres import Base


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), unique=True, index=True, nullable=False)
    sender_name = Column(String(200), nullable=False)
    sender_account = Column(String(100), nullable=False, index=True)
    receiver_name = Column(String(200), nullable=False)
    receiver_account = Column(String(100), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    transaction_type = Column(String(50), default="WIRE_TRANSFER")
    suspicious = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(String(500), nullable=True)
