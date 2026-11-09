from sqlalchemy import Column, String, Integer, DateTime, Float, JSON, Boolean, Text
from sqlalchemy.sql import func
from app.database.postgres import Base


class PublicCrimeReport(Base):
    __tablename__ = "public_crime_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String, unique=True, index=True)  # e.g., PUB-2026-0001
    reporter_name = Column(String, nullable=True)  # nullable for anonymous
    reporter_phone = Column(String, nullable=True)
    reporter_email = Column(String, nullable=True)
    is_anonymous = Column(Boolean, default=False)

    crime_type = Column(String, index=True)  # Theft, Assault, Harassment, Cyber, Other
    description = Column(Text, nullable=False)
    location_name = Column(String, nullable=True)  # Text address
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    incident_timestamp = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, default=func.now())

    # Evidence
    evidence_files = Column(JSON, default=[])  # List of {filename, sha256, type, size, path}

    # AI Satellite Analyzer Results
    satellite_verified = Column(Boolean, default=False)
    satellite_confidence = Column(Float, default=0.0)
    satellite_analysis = Column(JSON, default={})  # Detailed analysis breakdown
    exif_verified = Column(Boolean, default=False)

    # Routing
    nearest_station_id = Column(String, nullable=True)
    nearest_station_name = Column(String, nullable=True)
    distance_to_station_km = Column(Float, nullable=True)

    # Police Review
    status = Column(String, default="PENDING")  # PENDING, UNDER_REVIEW, VERIFIED, REJECTED, ACTION_TAKEN, CONVERTED
    reviewed_by_officer = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    rejection_reason = Column(String, nullable=True)

    # Link to official case (if verified and converted to FIR)
    converted_case_id = Column(String, nullable=True)
