from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database.postgres import Base


class CustodyTracker(Base):
    __tablename__ = "custody_tracker"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(100), nullable=False, index=True)
    suspect_id = Column(String(100), nullable=False, index=True)
    suspect_name = Column(String(200), nullable=False)
    investigating_officer = Column(String(200), nullable=True)
    police_station = Column(String(200), nullable=True)
    offenses = Column(String(300), nullable=True)

    arrest_timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    remand_expiry_timestamp = Column(DateTime, nullable=False)  # 24h from arrest (Sec 57 CrPC / Sec 58 BNSS)
    charge_sheet_deadline = Column(DateTime, nullable=False)    # 60 or 90 days from arrest (Sec 167 CrPC / Sec 187 BNSS)

    status = Column(String(50), default="ACTIVE", index=True)  # ACTIVE or CLOSED
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
