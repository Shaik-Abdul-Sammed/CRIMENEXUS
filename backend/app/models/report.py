from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database.postgres import Base


class PoliceReport(Base):
    __tablename__ = "police_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(100), unique=True, index=True, nullable=False)
    report_type = Column(String(50), nullable=False)  # FIR, WITNESS_STATEMENT, FORENSIC_REPORT
    case_number = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    filed_by = Column(String(200), nullable=False)
    witness_or_complainant = Column(String(200), nullable=True)
    suspects_mentioned = Column(String(500), nullable=True)
    incident_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
