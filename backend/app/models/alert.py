from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from datetime import datetime

from app.database.postgres import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)

    severity = Column(String(50), default="medium")
    threat_score = Column(Float)

    status = Column(String(50), default="new")

    created_at = Column(DateTime, default=datetime.utcnow)
