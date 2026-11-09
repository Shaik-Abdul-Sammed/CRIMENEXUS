"""
Test Suite: AI Satellite Geospatial Analyzer Core Service
Direct unit test coverage for backend/app/ml_service/satellite_analyzer.py:
1. Valid EXIF matching reported GPS coordinates
2. Missing EXIF metadata fallback handling
3. Future incident timestamp rejection and scoring
4. Anti-fraud duplicate SHA-256 evidence detection
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

from app.ml_service.satellite_analyzer import SatelliteAnalyzer


def create_jpeg_with_gps(lat: float, lon: float) -> bytes:
    """Creates a valid JPEG image embedding EXIF GPS IFD metadata."""
    img = Image.new("RGB", (100, 100), color=(120, 150, 180))
    exif = img.getexif()

    # Convert coordinates to degrees, minutes, seconds tuples
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

    # Tag 34853 corresponds to GPSInfo IFD
    exif[34853] = gps_ifd

    buf = io.BytesIO()
    img.save(buf, format="JPEG", exif=exif)
    buf.seek(0)
    return buf.getvalue()


def test_analyzer_exif_matching_reported_gps():
    """Test 1: EXIF GPS matches reported location within 100m -> high score."""
    analyzer = SatelliteAnalyzer()
    lat, lon = 28.6280, 77.3649
    valid_bytes = create_jpeg_with_gps(lat, lon)

    evidence_files = [
        {
            "filename": "camera_snap.jpg",
            "sha256": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "type": "image/jpeg",
            "size": len(valid_bytes),
            "content": valid_bytes,
        }
    ]

    timestamp = (datetime.utcnow() - timedelta(hours=2)).isoformat()
    result = analyzer.analyze(
        latitude=lat,
        longitude=lon,
        incident_timestamp=timestamp,
        crime_type="Theft",
        evidence_files=evidence_files,
    )

    assert result["confidence"] >= 0.65, f"Expected confidence >= 0.65, got {result['confidence']}"
    assert result["verified"] is True
    assert result["layers"]["exif"]["exif_found"] is True
    assert result["layers"]["exif"]["distance_km"] <= 0.2
    assert result["layers"]["timestamp"]["score"] >= 0.9


def test_analyzer_missing_exif_handling():
    """Test 2: Missing EXIF metadata gracefully scores 0.0 for EXIF layer without crashing."""
    analyzer = SatelliteAnalyzer()
    plain_img = Image.new("RGB", (50, 50), color=(200, 50, 50))
    buf = io.BytesIO()
    plain_img.save(buf, format="JPEG")
    raw_bytes = buf.getvalue()

    evidence_files = [
        {
            "filename": "screenshot_no_exif.jpg",
            "sha256": "11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff",
            "type": "image/jpeg",
            "size": len(raw_bytes),
            "content": raw_bytes,
        }
    ]

    timestamp = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    result = analyzer.analyze(
        latitude=28.1402,
        longitude=77.5510,
        incident_timestamp=timestamp,
        crime_type="Vandalism",
        evidence_files=evidence_files,
    )

    assert result["layers"]["exif"]["exif_found"] is False
    assert result["layers"]["exif"]["score"] == 0.0
    # Overall confidence is reduced because EXIF weight is 50%
    assert result["confidence"] < 0.65
    assert result["verified"] is False


def test_analyzer_future_timestamp_rejected():
    """Test 3: Future incident timestamp returns timestamp score 0.0 and flags future error."""
    analyzer = SatelliteAnalyzer()
    future_time = (datetime.utcnow() + timedelta(days=3)).isoformat()

    result = analyzer.analyze(
        latitude=28.6328,
        longitude=77.2197,
        incident_timestamp=future_time,
        crime_type="Cyber Fraud",
        evidence_files=[],
    )

    assert result["layers"]["timestamp"]["score"] == 0.0
    assert result["layers"]["timestamp"]["reason"] == "FUTURE_TIMESTAMP_INVALID"
    assert result["verified"] is False


def test_analyzer_duplicate_sha256_fraud_detection():
    """Test 4: Submitting duplicate image SHA-256 hashes triggers duplicate penalty."""
    analyzer = SatelliteAnalyzer()
    dummy_bytes = b"identical_file_payload_123"
    duplicate_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

    evidence_files = [
        {"filename": "snap_1.jpg", "sha256": duplicate_hash, "type": "image/jpeg", "size": 100, "content": dummy_bytes},
        {"filename": "snap_2.jpg", "sha256": duplicate_hash, "type": "image/jpeg", "size": 100, "content": dummy_bytes},
    ]

    timestamp = (datetime.utcnow() - timedelta(hours=5)).isoformat()
    result = analyzer.analyze(
        latitude=28.6280,
        longitude=77.3649,
        incident_timestamp=timestamp,
        crime_type="Theft",
        evidence_files=evidence_files,
    )

    # Duplicate detected flag in anti-fraud layer
    assert result["anti_fraud"]["duplicate_detected"] is True
    assert "DUPLICATE_FILE_DETECTED" in result["anti_fraud"]["flags"]
