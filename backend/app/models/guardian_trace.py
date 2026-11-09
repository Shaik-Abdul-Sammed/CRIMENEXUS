from sqlalchemy import Column, String, Integer, DateTime, Float, JSON, Boolean, Text
from sqlalchemy.sql import func
from app.database.postgres import Base


class MissingPersonCase(Base):
    __tablename__ = "missing_person_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True)  # MP-2026-0001
    person_name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    description = Column(Text, nullable=True)  # Physical description
    photo_url = Column(String, nullable=True)

    last_seen_lat = Column(Float, nullable=True)
    last_seen_lon = Column(Float, nullable=True)
    last_seen_time = Column(DateTime, nullable=False)
    last_seen_location = Column(String, nullable=True)

    reporter_name = Column(String, nullable=True)
    reporter_phone = Column(String, nullable=True)
    reporter_relation = Column(String, nullable=True)

    # Mobility & Behavior Profile
    mobile_number = Column(String, nullable=True)  # Their phone
    imei = Column(String, nullable=True)
    known_contacts = Column(JSON, default=[])  # Family/friends phone numbers
    frequent_locations = Column(JSON, default=[])  # Home, school, work coords
    medical_conditions = Column(JSON, default=[])  # Vulnerabilities

    status = Column(String, default="ACTIVE")  # ACTIVE, FOUND, DECEASED, COLD
    priority = Column(String, default="HIGH")  # CRITICAL (child <12), HIGH, MEDIUM

    assigned_officer = Column(String, nullable=True)
    station_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    closed_at = Column(DateTime, nullable=True)


class DigitalSighting(Base):
    __tablename__ = "digital_sightings"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, index=True)
    source = Column(String, index=True)  # IMEI_PING, WIFI, BLUETOOTH, UPI, TRANSIT, CCTV, CITIZEN, METRO_CARD
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    confidence = Column(Float, default=0.5)  # 0.0 to 1.0
    timestamp = Column(DateTime, nullable=False)
    raw_data = Column(JSON, default={})
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())


class SearchPrediction(Base):
    __tablename__ = "search_predictions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, index=True)
    predicted_lat = Column(Float, nullable=False)
    predicted_lon = Column(Float, nullable=False)
    confidence = Column(Float, default=0.5)
    time_window_start = Column(DateTime, nullable=True)
    time_window_end = Column(DateTime, nullable=True)
    reasoning = Column(JSON, default={})  # SHAP-style feature breakdown
    created_at = Column(DateTime, default=func.now())
