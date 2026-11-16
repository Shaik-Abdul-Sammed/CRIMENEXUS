from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean
from datetime import datetime
from app.database.postgres import Base


class EvidenceRecord(Base):
    """
    Cryptographically tracked evidence item conforming to Section 63 BSA 2023.
    """
    __tablename__ = "evidence_records"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(100), unique=True, index=True)
    case_id = Column(String(100), index=True)
    evidence_type = Column(String(100), default="DIGITAL")
    title = Column(String(255), default="Forensic Evidence")
    description = Column(Text, nullable=True)
    sha256_hash = Column(String(64), index=True)
    file_path = Column(String(500), nullable=True)
    collected_by = Column(String(150), default="Investigating Officer")
    collected_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="IN_CUSTODY")
    chain_of_custody_hash = Column(String(64), nullable=True)
