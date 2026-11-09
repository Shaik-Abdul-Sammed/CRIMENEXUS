import pytest
from datetime import date
from app.services.forensics.life_status_engine import life_status_engine
from app.models.fir_archive_models import OfficerRegistry, HistoricalFIR
from app.database.postgres import SessionLocal, Base, engine

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Create or update test officer DL-POL-IO-8812
    officer = db.query(OfficerRegistry).filter(OfficerRegistry.badge_number == "DL-POL-IO-8812").first()
    if not officer:
        officer = OfficerRegistry(
            badge_number="DL-POL-IO-8812",
            name="Insp. Rajesh Varma",
            rank="Inspector",
            station_id="PS-CENTRAL",
            posting_start=date(2018, 1, 1),
            total_firs_handled=42,
            conviction_count=28,
            acquittal_count=9,
            status="ACTIVE"
        )
        db.add(officer)
        db.commit()

    # Create retired officer
    retired_officer = db.query(OfficerRegistry).filter(OfficerRegistry.badge_number == "DL-POL-IO-8899").first()
    if not retired_officer:
        retired_officer = OfficerRegistry(
            badge_number="DL-POL-IO-8899",
            name="DSP Harinder Sandhu (Retd.)",
            rank="DSP",
            station_id="PS-CENTRAL",
            posting_start=date(2010, 1, 1),
            posting_end=date(2023, 12, 31),
            total_firs_handled=60,
            conviction_count=45,
            acquittal_count=10,
            status="RETIRED"
        )
        db.add(retired_officer)
        db.commit()

    yield db
    db.close()

def test_officer_career_analytics(db_session):
    db = db_session
    analytics = life_status_engine.get_officer_career_analytics("DL-POL-IO-8812", db=db)
    
    assert analytics["badge_number"] == "DL-POL-IO-8812"
    assert "Rajesh Varma" in analytics["name"]
    assert analytics["status"] == "ACTIVE"
    assert analytics["total_firs_handled"] >= 40
    assert analytics["conviction_count"] >= 25
    
    # Verify conviction rate is mathematically calculated correctly
    expected_rate = round((analytics["conviction_count"] / analytics["total_firs_handled"]) * 100, 1)
    assert abs(analytics["conviction_rate"] - expected_rate) < 0.2

def test_retired_officer_status(db_session):
    db = db_session
    analytics = life_status_engine.get_officer_career_analytics("DL-POL-IO-8899", db=db)
    assert analytics["status"] == "RETIRED"
    assert analytics["posting_end"] is not None
