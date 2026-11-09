"""
Test Suite: Police Verification & Conversion to Active FIR
Tests:
1. Police officer verifies and converts public report to official Case & FIR record with Neo4j dual-write
2. Police officer rejects public report with statutory ground and notes
3. Bulk review triage across multiple pending reports
"""

import os
import sys
from datetime import datetime, timedelta
import pytest

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient

from app.main import app
from app.database.postgres import SessionLocal
from app.models.public_report import PublicCrimeReport
from app.security.authentication import get_current_user
from app.models.user import User

client = TestClient(app)

# Mock authenticated police officer user
mock_officer = User(
    id="usr-test-io-8812",
    username="rajesh.varma",
    email="rajesh.varma@delhipolice.gov.in",
    role="INVESTIGATOR",
    full_name="Inspector Rajesh Varma",
    badge_number="DL-POL-IO-8812",
    jurisdiction_code="DL-01-SEC20",
    is_active=True,
)


@pytest.fixture(autouse=True)
def override_auth_user():
    """Overrides authentication dependency so police endpoints execute with officer credentials."""
    app.dependency_overrides[get_current_user] = lambda: mock_officer
    yield
    app.dependency_overrides.pop(get_current_user, None)


def create_test_report(status="PENDING", crime_type="Theft") -> PublicCrimeReport:
    """Helper to persist a test PublicCrimeReport in PostgreSQL."""
    db = SessionLocal()
    try:
        report_num = f"PUB-TEST-{int(datetime.utcnow().timestamp() * 1000)}"
        report = PublicCrimeReport(
            report_number=report_num,
            crime_type=crime_type,
            description="Witnessed cash theft near metro pillar 48.",
            location_name="Karol Bagh Metro Gate 2, Delhi",
            latitude=28.6517,
            longitude=77.1906,
            incident_timestamp=datetime.utcnow() - timedelta(hours=3),
            is_anonymous=False,
            reporter_name="Sunil Kumar",
            reporter_phone="+91 98111 22233",
            satellite_verified=True,
            satellite_confidence=0.88,
            status=status,
            nearest_station_id="PS-KAROL-BAGH",
            nearest_station_name="Karol Bagh Police Station",
            distance_to_station_km=0.85,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
    finally:
        db.close()


def test_police_review_verify_and_convert_to_fir():
    """Test 1: Officer approves report and converts into official Case with Neo4j dual-write."""
    report = create_test_report(status="PENDING", crime_type="Theft")

    # Step 1: Officer reviews and verifies report
    review_resp = client.post(
        f"/api/v1/police/reports/{report.id}/review",
        json={
            "action": "VERIFY",
            "notes": "Verified CCTV matches suspect description from Sector 20 CCPS FIR.",
            "statutory_sections": ["Sec 303(2) BNS 2023", "Sec 111 BNS"],
        },
    )
    assert review_resp.status_code == 200, f"Review failed: {review_resp.text}"
    review_data = review_resp.json()
    assert review_data["status"] == "SUCCESS"
    assert review_data["report"]["status"] == "VERIFIED"

    # Step 2: Officer converts verified report to official FIR & Case
    convert_resp = client.post(
        f"/api/v1/police/reports/{report.id}/convert",
        json={
            "statutory_charges": ["Sec 303(2) BNS 2023", "Sec 111 BNS (Organized Crime)"],
            "assigned_officer_id": mock_officer.id,
            "case_priority": "HIGH",
        },
    )
    assert convert_resp.status_code == 200, f"Conversion failed: {convert_resp.text}"
    convert_data = convert_resp.json()

    assert convert_data["status"] == "SUCCESS"
    assert "case_number" in convert_data
    assert convert_data["case_number"].startswith("CASE-2026-")
    assert convert_data["neo4j_linked"] is True
    assert convert_data["report_status"] == "CONVERTED"


def test_police_review_reject_with_statutory_reason():
    """Test 2: Officer rejects non-cognizable or duplicate report with mandatory reason."""
    report = create_test_report(status="PENDING", crime_type="Other")

    reject_resp = client.post(
        f"/api/v1/police/reports/{report.id}/review",
        json={
            "action": "REJECT",
            "rejection_reason": "CIVIL_DISPUTE_NON_COGNIZABLE",
            "notes": "Dispute relates to commercial tenant rent payment; non-cognizable under Section 173 BNSS.",
        },
    )
    assert reject_resp.status_code == 200, f"Rejection failed: {reject_resp.text}"
    reject_data = reject_resp.json()

    assert reject_data["status"] == "SUCCESS"
    assert reject_data["report"]["status"] == "REJECTED"
    assert reject_data["report"]["rejection_reason"] == "CIVIL_DISPUTE_NON_COGNIZABLE"


def test_police_bulk_review():
    """Test 3: Triage and bulk-review multiple pending reports simultaneously."""
    rep1 = create_test_report(status="PENDING")
    rep2 = create_test_report(status="PENDING")

    bulk_resp = client.post(
        "/api/v1/police/reports/bulk-review",
        json={
            "report_ids": [rep1.id, rep2.id],
            "action": "UNDER_REVIEW",
            "notes": "Assigned to Morning Patrol Sector 4 squad for field verification.",
        },
    )
    assert bulk_resp.status_code == 200, f"Bulk review failed: {bulk_resp.text}"
    bulk_data = bulk_resp.json()

    assert bulk_data["status"] == "SUCCESS"
    assert bulk_data["updated_count"] == 2
