from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Date
from datetime import datetime
from app.database.postgres import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(100), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    crime_type = Column(String(100))
    description = Column(Text)
    location = Column(String(200))
    status = Column(String(50), default="active")
    risk_level = Column(String(50), default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Historical FIR Archive & Forensic Linguistics fields
    detected_language = Column(String(50), nullable=True)
    fir_summary_en = Column(Text, nullable=True)
    original_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    officer_badge = Column(String(100), nullable=True)
    officer_name = Column(String(200), nullable=True)
    court_name = Column(String(200), nullable=True)
    case_outcome = Column(String(50), nullable=True)  # CONVICTED, ACQUITTED, PENDING, CLOSED, UNDERTRIAL
    outcome_date = Column(Date, nullable=True)
