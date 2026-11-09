import os
import json
import pytest
from app.database.postgres import SessionLocal, Base, engine
from app.models.guardian_trace import MissingPersonCase, DigitalSighting, SearchPrediction
from scripts.seed_missing_person_demo import seed_guardian_demo_case

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()

def test_demo_seed_idempotency_and_integrity(db_session):
    db = db_session
    
    # Run seeder first time
    case1 = seed_guardian_demo_case()
    assert case1.case_number == "MP-2026-DEMO-001"
    assert case1.person_name == "Aanya Sharma"
    assert case1.age == 8
    assert case1.priority == "CRITICAL"

    # Run seeder second time (must be idempotent - no duplicate cases created)
    case2 = seed_guardian_demo_case()
    assert case2.id == case1.id

    # Verify sightings count is exactly 12
    sightings = db.query(DigitalSighting).filter(DigitalSighting.case_id == case1.id).all()
    assert len(sightings) == 12, f"Expected exactly 12 sightings, found {len(sightings)}"

    # Verify predictions count is exactly 3
    predictions = db.query(SearchPrediction).filter(SearchPrediction.case_id == case1.id).all()
    assert len(predictions) == 3, f"Expected 3 predictions, found {len(predictions)}"

    # Check GeoJSON file exists on disk
    geojson_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "data", "demo", "guardian_trace_aanya.geojson"
    )
    assert os.path.exists(geojson_path), f"GeoJSON artifact missing at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        geo_data = json.load(f)
        assert geo_data["type"] == "FeatureCollection"
        assert len(geo_data["features"]) >= 12
