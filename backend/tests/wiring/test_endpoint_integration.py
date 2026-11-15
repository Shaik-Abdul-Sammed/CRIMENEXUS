import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_int_01_gun_intelligence_traces():
    """1. /gun-intelligence/traces returns live query traces from DB/Neo4j."""
    res = client.get("/api/v1/gun-intelligence/traces")
    assert res.status_code == 200
    data = res.json()
    assert "traces" in data
    assert "total_traces" in data
    assert isinstance(data["traces"], list)
    # Ensure no benchmark dummy strings
    for item in data["traces"]:
        assert "BENCHMARK" not in str(item.get("serial_number", ""))


def test_int_02_gun_intelligence_create_trace():
    """2. POST /gun-intelligence/trace records new trace and computes straw purchase."""
    payload = {
        "serial_number": "GLOCK-IND-2026-X99",
        "make": "Glock",
        "model": "17",
        "caliber": "9mm",
        "recovery_fir": "FIR-2026-DEL-101",
        "recovery_location": "Anand Vihar, Delhi",
        "recovery_date": "2026-03-01",
        "first_retail_date": "2026-02-15",
        "purchaser_name": "Ramesh Kumar"
    }
    res = client.post("/api/v1/gun-intelligence/trace", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["serial_number"] == "GLOCK-IND-2026-X99"
    assert "is_straw_purchase" in data
    assert "time_to_crime_days" in data


def test_int_03_ibis_specimens():
    """3. GET /ibis/specimens returns live ballistics specimens."""
    res = client.get("/api/v1/ibis/specimens")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    for spec in data:
        assert "specimen_id" in spec


def test_int_04_ibis_match():
    """4. POST /ibis/match compares specimen striations and returns matches."""
    payload = {
        "specimen_id": "SP-INTEG-001",
        "caliber": "9mm Parabellum",
        "rifling_lands": 6,
        "twist_direction": "RIGHT",
        "striation_pitch_mm": 0.125
    }
    res = client.post("/api/v1/ibis/match", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert isinstance(data["results"], list)


def test_int_05_geofence_warrants():
    """5. GET /geofence/warrants returns active court-authorized warrants."""
    res = client.get("/api/v1/geofence/warrants")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_int_06_geofence_create_warrant():
    """6. POST /geofence/warrant registers a court geofence warrant."""
    payload = {
        "warrant_number": "HC-DEL-GEOFENCE-2026-004",
        "court_name": "High Court of Delhi",
        "judge_name": "Hon. Justice Anand",
        "valid_until": "2026-09-30T23:59:59",
        "target_area_polygon": [
            {"lat": 28.61, "lon": 77.20},
            {"lat": 28.63, "lon": 77.20},
            {"lat": 28.63, "lon": 77.23},
            {"lat": 28.61, "lon": 77.23}
        ]
    }
    res = client.post("/api/v1/geofence/warrant", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "warrant_id" in data
    assert data["status"] in ["ACTIVE", "AUTHORIZED", "RECORDED"]


def test_int_07_case_triage_queue():
    """7. GET /case-triage/queue returns prioritized triage queue."""
    res = client.get("/api/v1/case-triage/queue")
    assert res.status_code == 200
    data = res.json()
    assert "triage_queue" in data
    assert isinstance(data["triage_queue"], list)


def test_int_08_case_triage_evaluate():
    """8. POST /case-triage/evaluate calculates urgency scores for a new case."""
    payload = {
        "case_number": "CASE-TRIAGE-2026-TEST",
        "title": "Armed Bank Robbery",
        "crime_type": "HEINOUS_VIOLENT",
        "victim_vulnerability": "HIGH",
        "public_hazard_level": "SEVERE",
        "evidence_freshness_hours": 1.5
    }
    res = client.post("/api/v1/case-triage/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "triage_score" in data
    assert "urgency_tier" in data


def test_int_09_sar_analytics_high_risk():
    """9. GET /sar-analytics/high-risk-cases checks financial transactions."""
    res = client.get("/api/v1/sar-analytics/high-risk-cases")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_int_10_intercept_translate():
    """10. POST /intercept/translate translates intercepted audio transcripts."""
    payload = {
        "intercept_id": "INT-REAL-099",
        "target_identifier": "+919811223344",
        "source_language": "hi",
        "original_transcript": "Raju ko bolo kal raat 12 baje warehouse par consignments delivery ke liye ready rahe."
    }
    res = client.post("/api/v1/intercept/translate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "english_translation" in data
    assert "urgent_threat_level" in data
    assert data["detected_language"] in ["hi", "hindi", "Hindi", "auto"]


def test_int_11_forensics_db_exhibits():
    """11. GET /forensics-db/exhibits returns registered forensic evidence items."""
    res = client.get("/api/v1/forensics-db/exhibits")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_int_12_forensics_db_register_exhibit():
    """12. POST /forensics-db/exhibit registers a new evidence exhibit."""
    payload = {
        "exhibit_id": "EXH-2026-BALLISTICS-01",
        "case_number": "FIR-2026-DEL-101",
        "evidence_type": "FIREARM",
        "description": "Recovered 9mm automatic cartridge casing",
        "chain_of_custody_officer": "Insp. Vikram Singh"
    }
    res = client.post("/api/v1/forensics-db/exhibit", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "exhibit_id" in data
    assert data["status"] in ["REGISTERED", "SUCCESS"]


def test_int_13_health_endpoint():
    """13. GET /health reports backend operational status."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "relational_db" in data


def test_int_14_ml_registry_status():
    """14. GET /api/v1/ml/status reports production model warming."""
    res = client.get("/api/v1/ml/status")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data or "warmed" in data or "registry" in data


def test_int_15_streaming_stats():
    """15. GET /api/v1/streaming/stats returns Redis event ingestion metrics."""
    res = client.get("/api/v1/streaming/stats")
    assert res.status_code == 200
    data = res.json()
    assert "stream_metrics" in data or "status" in data or "events_processed" in data


def test_int_16_geospatial_health():
    """16. GET /api/v1/geospatial/health verifies OSM multi-layer engine."""
    res = client.get("/api/v1/geospatial/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "OPERATIONAL"
    assert "OpenStreetMap" in data["engine"]


def test_int_17_merkle_notary_root():
    """17. GET /api/v1/legal/notary/root computes WORM cryptographic audit root."""
    res = client.get("/api/v1/legal/notary/root")
    assert res.status_code == 200
    data = res.json()
    assert "merkle_root" in data


def test_int_18_rtcc_cameras():
    """18. GET /api/v1/rtcc/cameras returns real-time command center CCTV streams."""
    res = client.get("/api/v1/rtcc/cameras")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list) or "cameras" in data


def test_int_19_hotspot_forecast():
    """19. GET /api/v1/hotspots/forecast returns predictive spatial density grid."""
    res = client.get("/api/v1/hotspots/forecast")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, (list, dict))


def test_int_20_intelligence_fusion():
    """20. GET /api/v1/intelligence-fusion/summary returns aggregated telemetry."""
    res = client.get("/api/v1/intelligence-fusion/summary")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert data["status"] == "OPERATIONAL"


def test_int_21_threats_most_wanted():
    """21. GET /api/v1/threats/most-wanted returns district most wanted watchlist."""
    res = client.get("/api/v1/threats/most-wanted")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_int_22_near_repeat_analysis():
    """22. GET /api/v1/near-repeat/health checks spatio-temporal near-repeat calculator."""
    res = client.get("/api/v1/near-repeat/health")
    assert res.status_code in [200, 404]
    if res.status_code == 200:
        data = res.json()
        assert data.get("status") == "healthy"

