from sqlalchemy import Column, Integer, String, Float

from app.database.postgres import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    city = Column(String(100))
    state = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
