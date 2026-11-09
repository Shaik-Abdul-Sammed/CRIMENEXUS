from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Date, JSON, Boolean
from datetime import datetime
from app.database.postgres import Base


class OfficerRegistry(Base):
    __tablename__ = "officer_registry"

    id = Column(Integer, primary_key=True, index=True)
    badge_number = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    rank = Column(String(100), default="Inspector")  # Constable, SI, Inspector, DSP, SP
    station_id = Column(String(100), index=True)
    posting_start = Column(Date, nullable=True)
    posting_end = Column(Date, nullable=True)  # NULL = currently posted
    total_firs_handled = Column(Integer, default=0)
    conviction_count = Column(Integer, default=0)
    acquittal_count = Column(Integer, default=0)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, RETIRED, TRANSFERRED, DECEASED


class SuspectLifeStatus(Base):
    __tablename__ = "suspect_life_status"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(String(100), index=True, nullable=False)  # Links to Neo4j / Person ID
    name = Column(String(200), nullable=False)
    aliases = Column(JSON, default=list)
    status = Column(String(50), default="UNKNOWN")  # ALIVE, DECEASED, PRESUMED_DEAD, ABSCONDING, UNKNOWN
    status_source = Column(String(100), default="UNVERIFIED")  # AADHAAR_DEATH, NCRB_DEATH, COURT_RECORD, UNVERIFIED
    status_verified_date = Column(Date, nullable=True)
    aadhaar_last_four = Column(String(10), nullable=True)
    last_known_address = Column(String(300), nullable=True)
    last_known_contact = Column(String(100), nullable=True)


class HistoricalFIR(Base):
    __tablename__ = "historical_firs"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(100), unique=True, index=True, nullable=False)
    year = Column(Integer, index=True, nullable=False)
    crime_type = Column(String(100), index=True, nullable=False)
    title = Column(String(200), nullable=False)
    location = Column(String(200), nullable=True)
    incident_date = Column(DateTime, nullable=True)
    
    # Multilingual & OCR attributes
    detected_language = Column(String(50), index=True, default="en")
    language_confidence = Column(Float, default=0.95)
    original_text = Column(Text, nullable=False)
    fir_summary_en = Column(Text, nullable=False)
    ocr_confidence = Column(Float, default=1.0)
    is_handwritten = Column(Boolean, default=False)
    
    # Officer & Court attributes
    officer_badge = Column(String(100), index=True, nullable=True)
    officer_name = Column(String(200), nullable=True)
    court_name = Column(String(200), nullable=True)
    case_outcome = Column(String(50), index=True, default="PENDING")  # CONVICTED, ACQUITTED, PENDING, CLOSED, UNDERTRIAL
    outcome_date = Column(Date, nullable=True)
    
    # Suspects & Entities
    suspects = Column(JSON, default=list)
    victims = Column(JSON, default=list)
    legal_sections = Column(JSON, default=list)
    analytics_cache = Column(JSON, default=dict)  # Precomputed 25 analytics cache
    
    created_at = Column(DateTime, default=datetime.utcnow)
