from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Date
from app.database.postgres import Base

class OfficerDisciplinaryRecord(Base):
    """
    Brady/Giglio Impeachment Material Disclosure Ledger.
    Maintains statutory disclosure records under Brady v. Maryland / Giglio v. United States
    and Section 146/155 Indian Evidence Act / Section 149 Bharatiya Sakshya Adhiniyam 2023.
    Tracks sustained findings of untruthfulness, excessive force, or evidence tampering
    that the prosecution is constitutionally required to disclose to the defense.
    """
    __tablename__ = "officer_disciplinary_records"

    id = Column(Integer, primary_key=True, index=True)
    badge_number = Column(String(100), index=True, nullable=False)
    officer_name = Column(String(200), nullable=False)
    incident_date = Column(Date, nullable=False)
    allegation_type = Column(String(100), nullable=False)  # UNTRUTHFULNESS, EVIDENCE_TAMPERING, EXCESSIVE_FORCE, BIAS
    investigation_id = Column(String(100), unique=True, nullable=False)
    finding = Column(String(50), nullable=False)  # SUSTAINED, EXONERATED, UNFOUNDED, NOT_SUSTAINED
    is_brady_material = Column(Boolean, default=True)
    summary_of_misconduct = Column(Text, nullable=False)
    prosecution_disclosure_status = Column(String(50), default="DISCLOSED")  # DISCLOSED, PENDING_REVIEW, EXEMPT
    sanction_imposed = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
