from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database.postgres import Base


class VehicleSighting(Base):
    __tablename__ = "vehicle_sightings"

    id = Column(Integer, primary_key=True, index=True)
    sighting_id = Column(String(100), unique=True, index=True, nullable=False)
    plate_number = Column(String(50), nullable=False, index=True)
    vehicle_model = Column(String(100), nullable=True)
    owner_name = Column(String(200), nullable=True)
    camera_id = Column(String(100), nullable=False)
    location_name = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    speed_kmh = Column(Float, nullable=True)
    confidence = Column(Float, default=0.95)
    source_type = Column(String(50), default="ANPR")  # ANPR, CCTV_FRAME, TOLL_BOOTH
    timestamp = Column(DateTime, default=datetime.utcnow)
