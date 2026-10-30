from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database.postgres import Base


class CallRecord(Base):
    __tablename__ = "call_records"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(100), unique=True, index=True, nullable=False)
    caller_number = Column(String(50), nullable=False, index=True)
    caller_name = Column(String(200), nullable=True)
    receiver_number = Column(String(50), nullable=False, index=True)
    receiver_name = Column(String(200), nullable=True)
    duration_seconds = Column(Integer, default=0)
    tower_id = Column(String(100), nullable=True)
    location_name = Column(String(200), nullable=True)
    call_type = Column(String(50), default="VOICE")
    timestamp = Column(DateTime, default=datetime.utcnow)
