from sqlalchemy import Column, Integer, String, Text, DateTime
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
