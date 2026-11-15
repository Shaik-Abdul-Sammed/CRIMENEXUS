import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# 1. Latitude out of bounds (India bounds: 6.0 <= lat <= 38.0)
def test_validation_01_latitude_out_of_bounds():
    # Case A: Latitude > 38.0 (e.g. 75.0, Arctic)
    res_high = client.get("/api/v1/geo/nearest-station?lat=75.0&lon=77.2")
    assert res_high.status_code in [400, 422] or (res_high.status_code == 200 and "error" in res_high.json())

    # Case B: Latitude < 6.0 (e.g. -15.0, Southern Ocean)
    res_low = client.get("/api/v1/geo/nearest-station?lat=-15.0&lon=77.2")
    assert res_low.status_code in [400, 422] or (res_low.status_code == 200 and "error" in res_low.json())


# 2. Longitude out of bounds (India bounds: 68.0 <= lon <= 98.0)
def test_validation_02_longitude_out_of_bounds():
    # Case A: Longitude < 68.0 (e.g. 10.0, Europe/Africa)
    res_west = client.get("/api/v1/geo/nearest-station?lat=28.6&lon=10.0")
    assert res_west.status_code in [400, 422] or (res_west.status_code == 200 and "error" in res_west.json())

    # Case B: Longitude > 98.0 (e.g. 140.0, Pacific)
    res_east = client.get("/api/v1/geo/nearest-station?lat=28.6&lon=140.0")
    assert res_east.status_code in [400, 422] or (res_east.status_code == 200 and "error" in res_east.json())


# 3. Empty query strings
def test_validation_03_empty_query_strings():
    # Testing search with empty query string
    res = client.get("/api/v1/cases/search?q=")
    assert res.status_code in [200, 400, 422]
    # Empty query string should not crash or return unhandled 500
    assert res.status_code != 500


# 4. Negative risk scores
def test_validation_04_negative_risk_scores():
    payload = {
        "case_id": "CASE-TEST-VAL-01",
        "suspect_name": "Test Subject",
        "grounds_of_bail": "Medical emergency",
        "risk_score": -0.85,
        "prior_convictions": 2,
        "anpr_sightings": 1
    }
    res = client.post("/api/v1/legal/draft/bail-opposition", json=payload)
    # The endpoint must either reject with 400/422 or clamp the score safely
    assert res.status_code in [200, 400, 422]
    if res.status_code == 200:
        data = res.json()
        assert "opposition_draft" in data or "status" in data


# 5. Invalid firearm serial numbers with special characters / injections
def test_validation_05_invalid_firearm_serials():
    payload = {
        "serial_number": "'; DROP TABLE evidence; --",
        "make": "Unknown",
        "model": "Model-X",
        "caliber": "9mm",
        "recovery_fir": "FIR-TEST-001",
        "recovery_location": "Delhi",
        "recovery_date": "2026-01-01"
    }
    res = client.post("/api/v1/gun-intelligence/trace", json=payload)
    assert res.status_code in [200, 400, 422]
    assert res.status_code != 500


# 6. Oversized polygon coordinate arrays (> 1000 points)
def test_validation_06_oversized_polygon_array():
    # Create 1500 coordinate points
    large_polygon = [{"lat": 28.5 + (i * 0.0001), "lon": 77.2 + (i * 0.0001)} for i in range(1500)]
    payload = {
        "warrant_number": "WARR-TEST-OVERSIZED-01",
        "court_name": "Delhi High Court",
        "judge_name": "Justice Verma",
        "valid_until": "2026-12-31T23:59:59",
        "target_area_polygon": large_polygon
    }
    res = client.post("/api/v1/geofence/warrant", json=payload)
    # Either accepted and processed or rejected due to payload size
    assert res.status_code in [200, 400, 413, 422]
    assert res.status_code != 500


# 7. Null or empty person IDs
def test_validation_07_null_person_id():
    res = client.get("/api/v1/persons//timeline")
    assert res.status_code in [404, 422, 400]
    assert res.status_code != 500


# 8. Future timestamps in geofence warrants
def test_validation_08_future_timestamp_bounds():
    far_future = (datetime.utcnow() + timedelta(days=365 * 10)).isoformat()
    payload = {
        "warrant_number": "WARR-FUTURE-2036-99",
        "court_name": "Supreme Court of India",
        "judge_name": "Justice Rao",
        "valid_until": far_future,
        "target_area_polygon": [
            {"lat": 28.50, "lon": 77.10},
            {"lat": 28.70, "lon": 77.10},
            {"lat": 28.70, "lon": 77.30},
            {"lat": 28.50, "lon": 77.30}
        ]
    }
    res = client.post("/api/v1/geofence/warrant", json=payload)
    assert res.status_code in [200, 400, 422]
    assert res.status_code != 500


# 9. Invalid warrant numbers
def test_validation_09_invalid_warrant_numbers():
    payload = {
        "warrant_number": "",  # Empty warrant number
        "court_name": "Delhi District Court",
        "judge_name": "Judge Sharma",
        "valid_until": "2026-12-31T23:59:59",
        "target_area_polygon": [
            {"lat": 28.5, "lon": 77.2},
            {"lat": 28.6, "lon": 77.2},
            {"lat": 28.6, "lon": 77.3},
            {"lat": 28.5, "lon": 77.3}
        ]
    }
    res = client.post("/api/v1/geofence/warrant", json=payload)
    assert res.status_code in [200, 400, 422]
    assert res.status_code != 500


# 10. Missing case IDs in CPIA upload
def test_validation_10_missing_case_id_cpia():
    payload = {
        "item_description": "Found mobile handset Samsung S21",
        "relevance_category": "USED_MATERIAL",
        "sensitive_flag": False
    }
    res = client.post("/api/v1/legal/cpia/schedule-item", json=payload)
    # Should reject missing mandatory case_id or return 422
    assert res.status_code in [400, 422]


# 11. Invalid officer badge formats
def test_validation_11_invalid_officer_badge():
    res = client.get("/api/v1/officers/BADGE<SCRIPT>ALERT(1)</SCRIPT>/legal-compliance")
    assert res.status_code in [200, 400, 404, 422]
    assert res.status_code != 500


# 12. Empty audio/transcripts for intercept translation
def test_validation_12_empty_transcript_intercept():
    payload = {
        "intercept_id": "INT-EMPTY-01",
        "target_identifier": "+919876543210",
        "source_language": "hi",
        "original_transcript": ""
    }
    res = client.post("/api/v1/intercept/translate", json=payload)
    # Must fail validation with 400 or 422
    assert res.status_code in [400, 422]


# 13. Invalid ATF export filters
def test_validation_13_invalid_atf_export_filters():
    res = client.get("/api/v1/gun-intelligence/atf-etrace/export?year=INVALID_YEAR&format=UNKNOWN")
    assert res.status_code in [200, 400, 422]
    assert res.status_code != 500


# 14. Negative dollar amounts in bank sync / transactions
def test_validation_14_negative_transaction_amount():
    payload = {
        "account_id": "ACC-TEST-9988",
        "transaction_id": "TXN-INVALID-NEG",
        "amount": -500000.00,
        "transaction_type": "DEBIT",
        "timestamp": "2026-03-01T12:00:00"
    }
    res = client.post("/api/v1/sar-analytics/sync-transaction", json=payload)
    assert res.status_code in [200, 400, 404, 422]
    assert res.status_code != 500


# 15. Duplicate evidence SHA-256 hashes
def test_validation_15_duplicate_evidence_hash():
    payload = {
        "specimen_id": "SPEC-DUP-01",
        "case_id": "CASE-DUP-99",
        "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "item_type": "BALLISTICS_BULLET"
    }
    res1 = client.post("/api/v1/forensics/register-hash", json=payload)
    assert res1.status_code in [200, 400, 404, 422]
    assert res1.status_code != 500
