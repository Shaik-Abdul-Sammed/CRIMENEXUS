"""
Test Suite: Citizen Sentinel Complete End-to-End Lifecycle
Full end-to-end integration test:
1. Citizen submits new public crime report with photo evidence via POST /api/v1/public/report/submit
2. AI Satellite Analyzer processes submission and routes to nearest station (Haversine)
3. Citizen checks status via GET /api/v1/public/report/status/{report_number} -> PENDING
4. Police officer retrieves pending reports from GET /api/v1/police/reports/pending
5. Police officer reviews report via POST /api/v1/police/reports/{id}/review -> VERIFIED
6. Police officer converts report to active case via POST /api/v1/police/reports/{id}/convert -> CONVERTED + Neo4j link
7. Citizen checks status again -> status reflects CONVERTED with converted_case_id and official case reference
"""

import io
import os
import sys
from datetime import datetime, timedelta
from PIL import Image
import pytest

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient

from app.main import app
from app.security.authentication import get_current_user
from app.models.user import User

client = TestClient(app)

mock_supervisory_officer = User(
    id="usr-sho-noida-sec20",
    username="sho.noida20",
    email="sho.noida20@uppolice.gov.in",
    role="SUPERVISOR",
    full_name="Station House Officer (SHO) Noida Sector 20",
    badge_number="UP-POL-SHO-2020",
    jurisdiction_code="UP-NOIDA-SEC20",
    is_active=True,
)


@pytest.fixture
def police_auth():
    """Overrides authentication to simulate logged-in Station House Officer."""
    app.dependency_overrides[get_current_user] = lambda: mock_supervisory_officer
    yield
    app.dependency_overrides.pop(get_current_user, None)


def create_jpeg_with_gps(lat: float, lon: float) -> bytes:
    """Creates in-memory JPEG with GPS IFD."""
    img = Image.new("RGB", (150, 150), color=(100, 140, 180))
    exif = img.getexif()

    def to_deg(val: float):
        abs_v = abs(val)
        d = int(abs_v)
        t1 = (abs_v - d) * 60
        m = int(t1)
        s = (t1 - m) * 60
        return ((d, 1), (m, 1), (int(s * 100), 100))

    gps_ifd = {
        1: "N" if lat >= 0 else "S",
        2: to_deg(lat),
        3: "E" if lon >= 0 else "W",
        4: to_deg(lon),
    }
    exif[34853] = gps_ifd

    buf = io.BytesIO()
    img.save(buf, format="JPEG", exif=exif)
    buf.seek(0)
    return buf.getvalue()


def test_complete_citizen_sentinel_e2e_flow():
    # -------------------------------------------------------------
    # Step 1: Citizen Submits Report with Photo Evidence
    # -------------------------------------------------------------
    lat, lon = 28.5815, 77.3308  # Near Noida Sector 20 Police Station
    photo_bytes = create_jpeg_with_gps(lat, lon)
    incident_time = (datetime.utcnow() - timedelta(hours=1)).isoformat()

    submit_data = {
        "crime_type": "Theft",
        "description": "Black Scorpio TS 09 AB 1234 broke bank gate barrier and fled southbound towards Yamuna Toll.",
        "location_name": "Noida Sector 20 Commercial Belt",
        "latitude": lat,
        "longitude": lon,
        "incident_timestamp": incident_time,
        "reporter_name": "Amit Saxena",
        "reporter_phone": "+91 99111 88223",
        "is_anonymous": "false",
    }

    files = [
        ("files", ("getaway_scorpio_snap.jpg", photo_bytes, "image/jpeg"))
    ]

    submit_resp = client.post("/api/v1/public/report/submit", data=submit_data, files=files)
    assert submit_resp.status_code == 200, f"Submit failed: {submit_resp.text}"
    submit_result = submit_resp.json()

    report_number = submit_result["report_number"]
    assert report_number.startswith("PUB-2026-")
    assert submit_result["status"] == "SUCCESS"
    assert submit_result["satellite_verdict"]["verified"] is True
    assert submit_result["satellite_verdict"]["confidence"] >= 0.65
    assert submit_result["nearest_station"]["name"] is not None

    # -------------------------------------------------------------
    # Step 2: Citizen Tracks Report Status (Public - No Auth Required)
    # -------------------------------------------------------------
    status_resp = client.get(f"/api/v1/public/report/status/{report_number}")
    assert status_resp.status_code == 200, f"Track status failed: {status_resp.text}"
    status_data = status_resp.json()

    assert status_data["report_number"] == report_number
    assert status_data["status"] == "PENDING"
    assert status_data["satellite_verified"] is True
    assert status_data["current_milestone_index"] == 1  # AI Analyzed

    # -------------------------------------------------------------
    # Step 3: Police Officer Logs In & Retrieves Pending Queue
    # -------------------------------------------------------------
    app.dependency_overrides[get_current_user] = lambda: mock_supervisory_officer
    try:
        queue_resp = client.get("/api/v1/police/reports/pending")
        assert queue_resp.status_code == 200, f"Queue fetch failed: {queue_resp.text}"
        pending_reports = queue_resp.json()

        target_report = next((r for r in pending_reports if r["report_number"] == report_number), None)
        assert target_report is not None, f"Report {report_number} not found in pending police queue"
        report_id = target_report["id"]

        # -------------------------------------------------------------
        # Step 4: Police Officer Reviews and Verifies Report
        # -------------------------------------------------------------
        review_resp = client.post(
            f"/api/v1/police/reports/{report_id}/review",
            json={
                "action": "VERIFY",
                "notes": "Fast-tracked: Corroborated with Yamuna Expressway Toll KM 48 ANPR optical scan.",
                "statutory_sections": ["Sec 303(2) BNS", "Sec 111 BNS"],
            },
        )
        assert review_resp.status_code == 200
        review_data = review_resp.json()
        assert review_data["report"]["status"] == "VERIFIED"

        # -------------------------------------------------------------
        # Step 5: Police Officer Converts to Official FIR & Case
        # -------------------------------------------------------------
        convert_resp = client.post(
            f"/api/v1/police/reports/{report_id}/convert",
            json={
                "statutory_charges": ["Sec 303(2) BNS 2023", "Sec 111 BNS 2023"],
                "assigned_officer_id": mock_supervisory_officer.id,
                "case_priority": "CRITICAL",
            },
        )
        assert convert_resp.status_code == 200
        convert_data = convert_resp.json()
        assert convert_data["status"] == "SUCCESS"
        assert convert_data["report_status"] == "CONVERTED"
        converted_case_id = convert_data["case_number"]
        assert converted_case_id.startswith("CASE-2026-")
        assert convert_data["neo4j_linked"] is True
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # -------------------------------------------------------------
    # Step 6: Citizen Status Reflects Case Conversion
    # -------------------------------------------------------------
    final_status_resp = client.get(f"/api/v1/public/report/status/{report_number}")
    assert final_status_resp.status_code == 200
    final_data = final_status_resp.json()

    assert final_data["status"] == "CONVERTED"
    assert final_data["converted_case_id"] == converted_case_id
    assert final_data["current_milestone_index"] == 4  # Action Taken / Case Registered
    assert "Yamuna Expressway Toll KM 48" in final_data["police_review"]["notes"]
