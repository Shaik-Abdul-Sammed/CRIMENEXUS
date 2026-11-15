from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from app.database.postgres import Base

class UnusedMaterial(Base):
    """
    UK Criminal Procedure and Investigations Act (CPIA) 1996 Schedule of Unused Material.
    Maintains schedules of non-sensitive (MG6C) and sensitive (MG6D) unused material gathered
    during criminal investigations. Discloses items that might reasonably undermine
    the prosecution case or assist the accused defense.
    """
    __tablename__ = "cpia_unused_materials"

    id = Column(Integer, primary_key=True, index=True)
    item_number = Column(Integer, nullable=False)
    case_id = Column(String(100), index=True, nullable=False)
    schedule_type = Column(String(10), default="MG6C")  # MG6C (Non-sensitive) or MG6D (Sensitive)
    description = Column(Text, nullable=False)
    location_stored = Column(String(200), nullable=False)
    relevance_to_case = Column(Text, nullable=True)
    undermines_prosecution = Column(Boolean, default=False)
    assists_defense = Column(Boolean, default=False)
    disclosure_decision = Column(String(50), default="DISCLOSE")  # DISCLOSE, WITHHOLD_PII, PUBLIC_INTEREST_IMMUNITY
    disclosure_reason = Column(Text, nullable=True)
    logged_by_badge = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
