from sqlalchemy import Column, Integer, String, Boolean
from app.database.postgres import Base


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    agency_type = Column(String(100), nullable=False)
    location = Column(String(150))
    contact_email = Column(String(255))
    is_active = Column(Boolean, default=True)
