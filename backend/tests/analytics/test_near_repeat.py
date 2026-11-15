import pytest
from datetime import datetime, timedelta, timezone
from app.services.analytics.near_repeat import NearRepeatCalculator, get_near_repeat_calculator
from app.api.near_repeat import near_repeat_health, get_active_near_repeat_alerts

def test_near_repeat_happy_path():
    """Happy Path: Verifies that recent crimes within contagion temporal window generate active zones and decay."""
    calculator = get_near_repeat_calculator()
    now = datetime.now(timezone.utc)
    crimes = [
        {
            "id": "CR-1",
            "offense": "Burglary",
            "lat": 28.50,
            "lon": 77.20,
            "location": "Sector 4",
            "timestamp": (now - timedelta(days=3)).isoformat()
        }
    ]
    res = calculator.compute_near_repeat_zones(crimes, spatial_bandwidth_m=300.0, temporal_window_days=14)
    assert res["total_origin_events"] == 1
    assert res["active_contagion_zones_count"] == 1
    zone = res["zones"][0]
    assert zone["relative_risk_multiplier"] > 1.0
    assert zone["days_remaining_in_window"] > 0
    assert len(zone["vulnerable_targets"]) == 3

def test_near_repeat_expired_window_edge_case():
    """Edge Case: An event occurred 45 days ago (outside 14-day window) should have no active contagion."""
    calculator = NearRepeatCalculator()
    now = datetime.now(timezone.utc)
    crimes = [
        {
            "id": "OLD-CRIME",
            "offense": "Theft",
            "lat": 28.50,
            "lon": 77.20,
            "location": "Sector 9",
            "timestamp": (now - timedelta(days=45)).isoformat()
        }
    ]
    res = calculator.compute_near_repeat_zones(crimes, spatial_bandwidth_m=300.0, temporal_window_days=14)
    assert res["active_contagion_zones_count"] == 0
    assert len(res["zones"]) == 0

def test_near_repeat_api_endpoint():
    """API Validation: Checks health endpoint and alert generation."""
    health = near_repeat_health()
    assert health["status"] == "healthy"
    
    alerts = get_active_near_repeat_alerts(district="South Delhi", window_days=14)
    assert alerts["district"] == "South Delhi"
    assert len(alerts["zones"]) >= 1
