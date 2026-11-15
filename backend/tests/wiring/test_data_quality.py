"""
Category 3: Data Quality & Input Validation Tests
Validates schema validation, edge case resilience, unicode handling,
geographical bounding, and spatial constraints across ingestion endpoints.
"""

import pytest
from fastapi.testclient import TestClient


def test_empty_fir_rejected(client: TestClient, auth_headers):
    """
    Test that ingestion of an empty FIR report is strictly rejected
    by Pydantic schema validation rather than causing database corruption.
    """
    payload = {
        "case_number": "CASE-DQ-001",
        "title": "Empty Report Test",
        "content": "",  # Empty content
        "filed_by": "Officer Smith"
    }
    response = client.post("/api/v1/ingest/report", json=payload, headers=auth_headers)
    assert response.status_code in [400, 422], f"Expected 400/422 but got {response.status_code}"
    error_data = response.json()
    assert "detail" in error_data
    assert len(error_data["detail"]) > 0


def test_fir_with_no_entities_handled(client: TestClient, auth_headers):
    """
    Test that an FIR with purely generic non-entity text processes cleanly
    without crashing spaCy NER and returns an empty entities list with 201 status.
    """
    payload = {
        "case_number": "CASE-DQ-002",
        "title": "Routine Generic Sighting",
        "content": "A person went to a place and walked around.",
        "filed_by": "Constable A. Kumar"
    }
    response = client.post("/api/v1/ingest/report", json=payload, headers=auth_headers)
    assert response.status_code == 201, f"Expected 201 Created but got {response.status_code}"
    data = response.json()
    assert data["status"] == "success"
    assert data["case_number"] == "CASE-DQ-002"
    assert isinstance(data.get("entities"), list)
    assert len(data.get("entities")) == 0


def test_cdr_with_missing_columns_rejected(client: TestClient, auth_headers):
    """
    Test that CDR record submission without mandatory caller_number is rejected.
    """
    payload = {
        "receiver_number": "+919876543210",
        "duration_seconds": 120,
        "tower_id": "CELL-TOWER-DELHI-01"
    }
    response = client.post("/api/v1/ingest/cdr", json=payload, headers=auth_headers)
    assert response.status_code in [400, 422]
    error_data = response.json()
    assert "detail" in error_data
    assert any("caller_number" in str(err) for err in error_data["detail"])


def test_bank_statement_with_invalid_dates_rejected(client: TestClient, auth_headers):
    """
    Test that financial transaction with malformed or invalid calendar dates is rejected.
    """
    payload = {
        "sender_name": "Rohan Mehra",
        "sender_account": "ACC-TEST-9901",
        "receiver_name": "Target Syndicate",
        "receiver_account": "ACC-TEST-9902",
        "amount": 25000.0,
        "currency": "INR",
        "timestamp": "99/99/9999"
    }
    response = client.post("/api/v1/ingest/bank", json=payload, headers=auth_headers)
    assert response.status_code in [400, 422]
    error_data = response.json()
    assert "detail" in error_data
    assert any("timestamp" in str(err) for err in error_data["detail"])


def test_phone_number_normalization(client: TestClient, auth_headers):
    """
    Test that phone numbers with spaces, hyphens, and formatting are normalized into clean digits/E.164.
    """
    payload = {
        "caller_number": "+91 98765-43210",
        "receiver_number": "(+91) 91234-56789",
        "duration_seconds": 45,
        "tower_id": "TOWER-NOIDA-05"
    }
    response = client.post("/api/v1/ingest/cdr", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["caller_number"] == "+919876543210"
    assert data["receiver_number"] == "+919123456789"


def test_unicode_hindi_fir_processed(client: TestClient, auth_headers, db):
    """
    Test that vernacular Devanagari Hindi text in FIR is preserved with correct UTF-8 encoding.
    """
    hindi_content = "अभियुक्त ने चाकू से हमला किया और मौके से फरार हो गया।"
    payload = {
        "case_number": "CASE-HINDI-2026",
        "title": "प्राथमिकी सूचना रिपोर्ट - धारा ३०७",
        "content": hindi_content,
        "filed_by": "सब इंस्पेक्टर रामेश्वर सिंह"
    }
    response = client.post("/api/v1/ingest/report", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["case_number"] == "CASE-HINDI-2026"

    # Query DB directly to verify UTF-8 integrity in PostgreSQL
    from app.models.report import PoliceReport
    report = db.query(PoliceReport).filter(PoliceReport.case_number == "CASE-HINDI-2026").first()
    assert report is not None
    assert report.content == hindi_content
    assert "चाकू" in report.content


def test_coordinates_outside_india_rejected(client: TestClient, auth_headers):
    """
    Test that geographic queries with coordinates outside Indian jurisdiction bounds are rejected with HTTP 400.
    """
    # Coordinates of London (lat 51.5074, lon -0.1278)
    response = client.get("/api/v1/geo/nearest-station?lat=51.5074&lon=-0.1278", headers=auth_headers)
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "out of valid jurisdictional bounds" in data["detail"]


def test_zero_length_polygon_rejected(client: TestClient, auth_headers):
    """
    Test that geofence reverse-location warrants with zero or degenerate coordinates are rejected with HTTP 400.
    """
    payload = {
        "case_id": "CASE-GEOFENCE-ZERO",
        "crime_description": "Testing empty polygon handling",
        "polygon_coordinates": "Polygon(())"
    }
    response = client.post("/api/v1/geofence/warrant", json=payload, headers=auth_headers)
    assert response.status_code in [400, 422]
    data = response.json()
    assert "detail" in data
    assert "at least 3 coordinate points" in data["detail"]
