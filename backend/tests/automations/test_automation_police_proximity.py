"""
Automation 5: Police Proximity Geodesic Engine & Road Intercept Routing.
Tests:
  1. Given lat/lon of Yamuna Expressway (28.1402, 77.5510) -> verify nearest police station identified.
  2. Verify OSRM route returns valid distance (>0) and duration (>0).
  3. Given lat/lon in Arabian Sea -> verify "no station found within radius" error.
  4. Verify fallback to Haversine when OSRM is unreachable.
  5. Verify response latency < 500ms.
"""

import sys
import time
from fastapi.testclient import TestClient

from app.main import app
from app.services.geo.police_proximity import (
    find_nearest_police_stations,
    calculate_osrm_route,
    haversine_distance_km
)

client = TestClient(app)


def test_proximity_nearest_station_yamuna():
    """Test 1: Given lat/lon of Yamuna Expressway (28.1402, 77.5510) -> verify nearest police station identified."""
    lat, lon = 28.1402, 77.5510
    stations = find_nearest_police_stations(latitude=lat, longitude=lon, top_k=3)

    assert len(stations) >= 1
    nearest = stations[0]
    assert "police_station" in nearest
    assert "station_latitude" in nearest
    assert "station_longitude" in nearest
    assert nearest["distance_km"] < 5.0
    assert any(k in nearest["police_station"] for k in ["Yamuna", "Noida", "Expressway", "Police"])


def test_proximity_osrm_route_validity():
    """Test 2: Verify OSRM route returns valid distance (>0) and duration (>0)."""
    start_lat, start_lon = 28.5830, 77.3320  # Sector 20 PS
    incident_lat, incident_lon = 28.1402, 77.5510  # Yamuna Expressway

    route = calculate_osrm_route(start_lat, start_lon, incident_lat, incident_lon)
    assert route["status"] == "SUCCESS"
    assert route["distance_km"] > 0
    assert route["duration_minutes"] > 0
    assert len(route["coordinates"]) >= 2
    assert "routing_engine" in route


def test_proximity_arabian_sea_no_station_within_radius():
    """Test 3: Given lat/lon in Arabian Sea -> verify 'no station found within radius' error."""
    # Mid-Arabian Sea coordinates far off the Indian coastline
    sea_lat, sea_lon = 15.0000, 65.0000

    # 3a: Function call with max_radius_km=100
    stations = find_nearest_police_stations(latitude=sea_lat, longitude=sea_lon, top_k=3, max_radius_km=100.0)
    assert len(stations) == 0, f"Expected 0 stations within 100km of mid-Arabian sea, got {len(stations)}"

    # 3b: API call with max_radius_km=100 returns 404
    res = client.get(f"/api/v1/geo/nearest-station?lat={sea_lat}&lon={sea_lon}&max_radius_km=100")
    assert res.status_code == 404, f"Expected 404 Not Found for Arabian sea query, got {res.status_code}"
    assert "no police station found" in res.json()["detail"].lower()


def test_proximity_fallback_to_haversine():
    """Test 4: Verify fallback to Haversine geodesic routing when OSRM is unreachable."""
    from unittest.mock import patch

    # Mock requests.get to simulate complete OSRM server failure
    with patch("requests.get", side_effect=Exception("OSRM server offline")):
        route = calculate_osrm_route(28.5830, 77.3320, 28.1402, 77.5510)
        assert route["status"] == "SUCCESS"
        assert "Geodesic" in route["routing_engine"]
        assert route["distance_km"] > 0
        assert route["duration_minutes"] > 0
        assert len(route["coordinates"]) >= 2


def test_proximity_response_latency_under_500ms():
    """Test 5: Verify response latency < 500ms."""
    lat, lon = 28.1402, 77.5510
    start = time.perf_counter()
    res = client.get(f"/api/v1/geo/nearest-station?lat={lat}&lon={lon}&top_k=3")
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    assert res.status_code == 200
    assert elapsed_ms < 500.0, f"Latency {elapsed_ms:.2f}ms exceeds 500ms requirement"
    print(f"Nearest station query latency: {elapsed_ms:.2f}ms")


if __name__ == "__main__":
    test_proximity_nearest_station_yamuna()
    test_proximity_osrm_route_validity()
    test_proximity_arabian_sea_no_station_within_radius()
    test_proximity_fallback_to_haversine()
    test_proximity_response_latency_under_500ms()
    print("ALL 5 Police Proximity Automation Tests PASSED.")
