import pytest
from datetime import datetime, date
from app.services.forensics.life_status_engine import LifeStatusEngine

def test_suspect_in_aadhaar_death_mock_returns_deceased():
    engine = LifeStatusEngine()
    # "Ramesh Chandra Sharma" with aadhaar_last_four="9012" is in mock_aadhaar_death_records.json
    res = engine.infer_suspect_life_status(
        person_id="P-TEST-001",
        name="Ramesh Chandra Sharma",
        aadhaar_last_four="9012"
    )
    assert res["status"] == "DECEASED"
    assert res["status_source"] == "AADHAAR_DEATH"
    assert "DTH-NDMC" in res.get("registration_number", "") or "Aadhaar Death" in res["evidence_note"]

def test_suspect_with_recent_fir_activity_returns_alive():
    engine = LifeStatusEngine()
    # Recent FIR date (e.g., 2025 or 2026) within 2 years
    res = engine.infer_suspect_life_status(
        person_id="P-TEST-002",
        name="Active Target Suspect",
        last_fir_date=date(2025, 4, 15)
    )
    assert res["status"] == "ALIVE"
    assert res["status_source"] == "LAST_KNOWN_FIR"
    assert "Active participation" in res["evidence_note"]

def test_suspect_no_activity_10_years_presumed_dead():
    engine = LifeStatusEngine()
    # Last FIR activity in 2012 (14 years ago, >= 7 / 10 years)
    res = engine.infer_suspect_life_status(
        person_id="P-TEST-003",
        name="Archival Cold Suspect",
        last_fir_date=date(2012, 1, 10)
    )
    assert res["status"] == "PRESUMED_DEAD"
    assert res["status_source"] == "COURT_RECORD"
    assert "Section 108" in res["evidence_note"]

def test_warrant_after_25_years_presumed_dead():
    engine = LifeStatusEngine()
    # Unexecuted warrant from 1998 (28 years ago)
    res = engine.infer_suspect_life_status(
        person_id="P-TEST-004",
        name="Fugitive From 1998",
        warrant_year=1998
    )
    assert res["status"] == "PRESUMED_DEAD"
    assert res["status_source"] == "COURT_RECORD"
    assert "Section 108" in res["evidence_note"]
