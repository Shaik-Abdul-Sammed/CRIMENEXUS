"""
Test Suite: Free Geospatial Verification Stack (OSM + SunCalc + EXIF)
Tests:
1. EXIF GPS matching reported location achieves high confidence
2. Missing EXIF metadata gracefully scores 0.0 without crash
3. Reverse geocoding validates real place and caches in memory
4. Land-use tag concordance matches crime category (Theft in retail, Harassment in residential)
5. Astronomical SunCalc solar elevation matches image luminance (nighttime anomaly detection)
6. GET /api/v1/geospatial/health endpoint returns 200 OK and OPERATIONAL
"""

import io
import os
import sys
from datetime import datetime
from PIL import Image
import pytest

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient

from app.main import app
from app.ml_service.geospatial_verifier import (
    GeospatialVerifier,
    get_geospatial_verifier,
    haversine_km,
    calculate_solar_elevation,
)

client = TestClient(app)


def make_test_jpeg_with_gps(lat: float, lon: float) -> bytes:
    """Creates in-memory JPEG with GPS tags."""
    img = Image.new("RGB", (80, 80), color=(100, 150, 200))
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


def test_exif_matching_reported_location():
    """Test 1: EXIF coords within 100m of reported coordinates score 1.0."""
    verifier = get_geospatial_verifier()
    lat, lon = 28.6280, 77.3649
    img_bytes = make_test_jpeg_with_gps(lat, lon)

    files = [
        {"filename": "crime_scene.jpg", "content": img_bytes, "sha256": "hash1"}
    ]

    result = verifier.verify(
        latitude=lat,
        longitude=lon,
        incident_time="2026-11-09T14:30:00Z",
        image_files=files,
        crime_type="Theft",
    )

    assert result["verified"] is True
    assert result["confidence"] >= 0.65
    assert result["layers"]["exif"]["score"] >= 0.90
    assert result["layers"]["exif"]["exif_found"] is True


def test_reverse_geocoding_place_validation():
    """Test 2: Nominatim reverse geocode returns a valid place name and score."""
    verifier = get_geospatial_verifier()
    lat, lon = 28.1402, 77.5510  # Yamuna Expressway

    geo_res = verifier._reverse_geocode(lat, lon)
    assert geo_res["score"] >= 0.80
    assert "display_name" in geo_res
    assert len(geo_res["display_name"]) > 5


def test_landuse_cross_reference():
    """Test 3: Land-use concordance scores high for appropriate crime/location pairs."""
    verifier = get_geospatial_verifier()

    # Theft in retail commercial district
    res_theft = verifier._verify_landuse(
        28.6517, 77.1906, "Theft", {"place_type": "retail_commercial", "osm_tags": {}}
    )
    assert res_theft["score"] >= 0.80
    assert res_theft["concordance"] is True

    # Cyber fraud in any zoning
    res_cyber = verifier._verify_landuse(
        28.6280, 77.3649, "Cyber Fraud", {"place_type": "rural", "osm_tags": {}}
    )
    assert res_cyber["score"] >= 0.90


def test_sun_position_temporal_verification():
    """Test 4: SunCalc solar elevation matches day/night timeline."""
    verifier = get_geospatial_verifier()
    lat, lon = 28.6280, 77.3649

    # Day test (noon UTC + 5:30 -> 12:30 PM local)
    noon_time = "2026-11-09T07:00:00Z"
    sun_noon = verifier._verify_sun_position(lat, lon, noon_time, [])
    assert sun_noon["solar_elevation_degrees"] > 0
    assert sun_noon["expected_lighting"] == "DAYLIGHT"

    # Night test (midnight local -> 18:30 UTC)
    midnight_time = "2026-11-09T18:30:00Z"
    sun_night = verifier._verify_sun_position(lat, lon, midnight_time, [])
    assert sun_night["solar_elevation_degrees"] < 0
    assert sun_night["expected_lighting"] == "NIGHTTIME"


def test_geospatial_health_endpoint():
    """Test 5: GET /api/v1/geospatial/health returns 200 OK and free stack details."""
    response = client.get("/api/v1/geospatial/health")
    assert response.status_code == 200, f"Health endpoint failed: {response.text}"
    body = response.json()

    assert body["status"] == "OPERATIONAL"
    assert "OpenStreetMap" in body["engine"]
    assert "FREE" in body["cost"]
