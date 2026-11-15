from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database.postgres import Base


class SmartMeterReading(Base):
    """
    IoT Smart Electric Meter Reading Model.
    Tracks real-time kWh consumption surges across Pan-NCR substations
    to detect illicit power draw at safehouses and crypto-mining hideouts.
    """
    __tablename__ = "smart_meter_readings"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(String(100), index=True)
    address = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)
    kwh_reading = Column(Float)
    baseline_kwh = Column(Float)
    reading_timestamp = Column(DateTime, index=True)
    created_at = Column(DateTime, default=func.now())
