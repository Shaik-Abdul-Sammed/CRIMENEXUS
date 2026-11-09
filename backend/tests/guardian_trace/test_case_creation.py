import pytest
from datetime import datetime, timezone
from fastapi import HTTPException
from app.services.guardian_trace.fusion_engine import GuardianFusionEngine
from app.api.guardian_trace import CaseCreateRequest, create_missing_person_case
from app.models.guardian_trace import MissingPersonCase
from app.database.postgres import SessionLocal, Base, engine

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()

def test_case_creation_valid_data(setup_db):
    db = setup_db
    payload = CaseCreateRequest(
        person_name="Aanya Sharma",
        age=8,
        gender="Female",
        description="Wearing red school uniform, carrying yellow backpack.",
        last_seen_lat=28.5355,
        last_seen_lon=77.3910,
        last_seen_time=datetime.now(timezone.utc),
        last_seen_location="Sector 62, Noida, Uttar Pradesh",
        reporter_name="Sunita Sharma",
        reporter_phone="+91 98101 23456",
        reporter_relation="Mother",
        mobile_number="+91 98111 89012",
        imei="864209041234567",
        priority="MEDIUM",  # Request specifies medium, but age < 12 should elevate
        assigned_officer="Insp. Vikram Rathore",
        station_id="PS-NOIDA-SEC62"
    )

    res = create_missing_person_case(payload, db=db)
    assert res["status"] == "SUCCESS"
    assert "case_number" in res
    assert res["priority"] == "CRITICAL", "Child < 12 must automatically receive CRITICAL priority per Bachpan Bachao mandate"

    # Verify database persistence
    case = db.query(MissingPersonCase).filter(MissingPersonCase.case_number == res["case_number"]).first()
    assert case is not None
    assert case.person_name == "Aanya Sharma"
    assert case.age == 8
    assert case.last_seen_lat == 28.5355
    assert case.last_seen_lon == 77.3910
    assert case.photo_url is None

def test_photo_is_optional(setup_db):
    db = setup_db
    payload = CaseCreateRequest(
        person_name="Ramesh Verma",
        age=24,
        gender="Male",
        description="Adult male last seen near transit hub.",
        last_seen_lat=28.6139,
        last_seen_lon=77.2090,
        last_seen_time=datetime.now(timezone.utc),
        last_seen_location="Connaught Place, New Delhi",
        reporter_name="Sunil Verma",
        reporter_phone="+91 99999 11111",
        reporter_relation="Brother",
        priority="HIGH",
        assigned_officer="SI Ajay Singh",
        station_id="PS-CP-CENTRAL"
    )

    res = create_missing_person_case(payload, db=db)
    assert res["status"] == "SUCCESS"
    assert res["priority"] == "HIGH"

    case = db.query(MissingPersonCase).filter(MissingPersonCase.case_number == res["case_number"]).first()
    assert case is not None
    assert case.photo_url is None

def test_child_under_12_priority_auto_critical(setup_db):
    db = setup_db
    # Test age 6
    payload_child = CaseCreateRequest(
        person_name="Kabir Mehra",
        age=6,
        gender="Male",
        description="Lost in shopping mall.",
        last_seen_lat=28.5000,
        last_seen_lon=77.4000,
        last_seen_time=datetime.now(timezone.utc),
        last_seen_location="DLF Mall of India",
        reporter_name="Ananya Mehra",
        reporter_phone="+91 98765 43210",
        reporter_relation="Mother",
        priority="LOW"  # Deliberately set to LOW
    )
    res_child = create_missing_person_case(payload_child, db=db)
    assert res_child["priority"] == "CRITICAL", "Child under 12 must be forced to CRITICAL"

    # Test age 15 (teenager) respects input or high default
    payload_teen = CaseCreateRequest(
        person_name="Devika Sen",
        age=15,
        gender="Female",
        description="Teenager left school without notice.",
        last_seen_lat=28.5100,
        last_seen_lon=77.4100,
        last_seen_time=datetime.now(timezone.utc),
        last_seen_location="Sector 18, Noida",
        reporter_name="Alok Sen",
        reporter_phone="+91 98765 43211",
        reporter_relation="Father",
        priority="MEDIUM"
    )
    res_teen = create_missing_person_case(payload_teen, db=db)
    assert res_teen["priority"] == "MEDIUM", "Age >= 12 can retain specified priority"

def test_invalid_coordinates_return_400(setup_db):
    db = setup_db
    # Latitude > 90
    invalid_lat_high = CaseCreateRequest(
        person_name="Test Person",
        last_seen_lat=95.0,
        last_seen_lon=77.0,
        last_seen_time=datetime.now(timezone.utc),
        last_seen_location="Invalid Location"
    )
    with pytest.raises(HTTPException) as excinfo:
        create_missing_person_case(invalid_lat_high, db=db)
    assert excinfo.value.status_code == 400
    assert "Invalid latitude" in excinfo.value.detail

    # Latitude < -90
    invalid_lat_low = CaseCreateRequest(
        person_name="Test Person",
        last_seen_lat=-91.0,
        last_seen_lon=77.0,
        last_seen_time=datetime.now(timezone.utc),
        last_seen_location="Invalid Location"
    )
    with pytest.raises(HTTPException) as excinfo:
        create_missing_person_case(invalid_lat_low, db=db)
    assert excinfo.value.status_code == 400

    # Longitude > 180
    invalid_lon_high = CaseCreateRequest(
        person_name="Test Person",
        last_seen_lat=28.0,
        last_seen_lon=185.0,
        last_seen_time=datetime.now(timezone.utc),
        last_seen_location="Invalid Location"
    )
    with pytest.raises(HTTPException) as excinfo:
        create_missing_person_case(invalid_lon_high, db=db)
    assert excinfo.value.status_code == 400
    assert "Invalid longitude" in excinfo.value.detail
