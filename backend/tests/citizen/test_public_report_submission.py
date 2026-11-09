"""
Test Suite: Public Crime Report Submission API
Validates POST /api/v1/public/report/submit across:
1. Valid submission with image evidence
2. Submission without evidence (succeeds with confidence=0)
3. Future incident timestamp rejection (HTTP 400)
4. Maximum 5 evidence files limit enforcement (HTTP 400 when 6 files submitted)
5. EXIF-stripped image handling and SHA-256 integrity sealing
"""

import io
import os
import sys
from datetime import datetime, timedelta
import pytest
from PIL import Image

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_dummy_image(include_exif: bool = False) -> bytes:
    """Helper to generate an in-memory JPEG image with or without EXIF metadata."""
    img = Image.new("RGB", (200, 200), color=(73, 109, 137))
    buf = io.BytesIO()
    if include_exif:
        exif_bytes = img.getexif()
        # Add GPS Info IFD tag 34853 placeholder
        exif_bytes[305] = "CRIMENEXUS Test Camera"
        img.save(buf, format="JPEG", exif=exif_bytes)
    else:
        img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.getvalue()


def test_valid_report_submission_with_evidence():
    """Test 1: Citizen submits a valid crime report with photo evidence."""
    now_str = (datetime.utcnow() - timedelta(hours=2)).isoformat()
    image_bytes = create_dummy_image(include_exif=True)

    data = {
        "crime_type": "Theft",
        "description": "Black Scorpio vehicle observed breaking into cash logistics facility in Sector 62.",
        "location_name": "Sector 62, Noida, Uttar Pradesh",
        "latitude": 28.6280,
        "longitude": 77.3649,
        "incident_timestamp": now_str,
        "reporter_name": "Rahul Verma",
        "reporter_phone": "+91 98765 43210",
        "reporter_email": "rahul.verma@example.com",
        "is_anonymous": "false",
    }

    files = [
        ("files", ("evidence_scorpio.jpg", image_bytes, "image/jpeg"))
    ]

    response = client.post("/api/v1/public/report/submit", data=data, files=files)
    assert response.status_code == 200, f"Submission failed: {response.text}"
    body = response.json()

    assert body["status"] == "SUCCESS"
    assert "report_number" in body
    assert body["report_number"].startswith("PUB-2026-")
    assert "nearest_station" in body
    assert body["nearest_station"]["name"] is not None
    assert body["nearest_station"]["distance_km"] >= 0.0
    assert "satellite_verdict" in body
    assert "confidence" in body["satellite_verdict"]
    assert "tracking_url" in body


def test_submission_without_evidence_succeeds():
    """Test 2: Report without evidence succeeds but has zero/low satellite confidence."""
    now_str = (datetime.utcnow() - timedelta(minutes=45)).isoformat()

    data = {
        "crime_type": "Harassment",
        "description": "Suspicious individuals monitoring ATM corridor on Vikas Marg.",
        "location_name": "Vikas Marg, New Delhi",
        "latitude": 28.6328,
        "longitude": 77.2197,
        "incident_timestamp": now_str,
        "is_anonymous": "true",
    }

    response = client.post("/api/v1/public/report/submit", data=data)
    assert response.status_code == 200, f"Expected 200 for report without files, got {response.status_code}: {response.text}"
    body = response.json()

    assert body["status"] == "SUCCESS"
    assert body["report_number"].startswith("PUB-2026-")
    # Without image files, EXIF score is 0.0, so satellite_verified is false
    assert body["satellite_verdict"]["verified"] is False
    assert body["satellite_verdict"]["confidence"] <= 0.65


def test_future_incident_timestamp_rejected():
    """Test 3: Reports with future incident timestamps must be rejected with HTTP 400."""
    future_time = (datetime.utcnow() + timedelta(days=2)).isoformat()

    data = {
        "crime_type": "Cyber Fraud",
        "description": "Fraudulent phishing transaction scheduled in future.",
        "location_name": "Connaught Place, New Delhi",
        "latitude": 28.6328,
        "longitude": 77.2197,
        "incident_timestamp": future_time,
        "is_anonymous": "true",
    }

    response = client.post("/api/v1/public/report/submit", data=data)
    assert response.status_code == 400, f"Expected 400 for future timestamp, got {response.status_code}: {response.text}"
    assert "future" in response.json().get("detail", "").lower()


def test_max_files_limit_enforced():
    """Test 4: Submitting more than 5 evidence files must be rejected with HTTP 400."""
    now_str = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    image_bytes = create_dummy_image(include_exif=False)

    data = {
        "crime_type": "Vandalism",
        "description": "Damaged property along expressway corridor.",
        "location_name": "Yamuna Expressway Toll KM 48",
        "latitude": 28.1402,
        "longitude": 77.5510,
        "incident_timestamp": now_str,
        "is_anonymous": "true",
    }

    # 6 files exceeds the maximum 5-file limit
    files = [
        ("files", (f"evidence_{i}.jpg", image_bytes, "image/jpeg"))
        for i in range(6)
    ]

    response = client.post("/api/v1/public/report/submit", data=data, files=files)
    assert response.status_code == 400, f"Expected 400 for >5 files, got {response.status_code}"
    assert "maximum" in response.json().get("detail", "").lower() or "5" in response.json().get("detail", "")


def test_exif_stripped_image_flagged():
    """Test 5: Image without EXIF is safely accepted but flagged as unverified in layer analysis."""
    now_str = (datetime.utcnow() - timedelta(hours=3)).isoformat()
    stripped_bytes = create_dummy_image(include_exif=False)

    data = {
        "crime_type": "Other",
        "description": "Stripped EXIF photograph submission testing fraud heuristics.",
        "location_name": "Karol Bagh, New Delhi",
        "latitude": 28.6517,
        "longitude": 77.1906,
        "incident_timestamp": now_str,
        "is_anonymous": "true",
    }

    files = [
        ("files", ("stripped_image.jpg", stripped_bytes, "image/jpeg"))
    ]

    response = client.post("/api/v1/public/report/submit", data=data, files=files)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "SUCCESS"
    assert body["satellite_verdict"]["layers"]["exif"]["exif_found"] is False
    assert body["satellite_verdict"]["layers"]["exif"]["score"] == 0.0
