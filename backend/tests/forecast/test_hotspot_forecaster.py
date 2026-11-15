import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ml_service.hotspot_forecaster import HotspotForecaster

client = TestClient(app)

def test_hotspot_forecaster_happy_path():
    """Test Feature 3: Predicts top hotspots with probability between 0 and 1."""
    hotspots = HotspotForecaster.predict_hotspots("DELHI_CENTRAL", 1)
    assert len(hotspots) >= 5
    for hs in hotspots:
        assert 0.0 <= hs["predicted_probability"] <= 1.0
        assert "latitude" in hs and "longitude" in hs
        assert hs["risk_tier"] in ["CRITICAL", "HIGH", "MEDIUM"]

def test_hotspot_forecast_api_endpoints():
    """Test Feature 3 API: Endpoint /api/v1/forecast/hotspots and health respond 200."""
    health_resp = client.get("/api/v1/hotspot-forecast/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"

    resp = client.get("/api/v1/forecast/hotspots?district=DELHI_CENTRAL&days_ahead=2")
    assert resp.status_code == 200
    data = resp.json()
    assert "hotspots" in data
    assert data["hotspots_count"] >= 5

def test_hotspot_forecast_invalid_district_fallback():
    """Test Feature 3 Edge Case: Unknown district falls back to robust default."""
    hotspots = HotspotForecaster.predict_hotspots("UNKNOWN_RURAL_ZONE", 1)
    assert len(hotspots) >= 5
    assert hotspots[0]["predicted_probability"] > 0
