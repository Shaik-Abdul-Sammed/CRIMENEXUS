import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.geo.police_proximity import (
    find_nearest_police_stations,
    calculate_osrm_route,
    haversine_distance_km,
)

client = TestClient(app)


def test_nearest_police_station_algorithm():
    # Rajan's last ANPR sighting coordinates at Yamuna Expressway Toll KM 48
    sighting_lat = 28.1402
    sighting_lon = 77.5510

    stations = find_nearest_police_stations(latitude=sighting_lat, longitude=sighting_lon, top_k=3)
    assert len(stations) >= 1

    nearest = stations[0]
    assert "police_station" in nearest
    assert "station_latitude" in nearest
    assert "station_longitude" in nearest
    assert nearest["distance_km"] >= 0.0
    assert nearest["distance_meters"] >= 0
    # The dedicated toll checkpoint PS should be the closest (< 2 km)
    assert nearest["distance_km"] < 5.0
    assert "Yamuna" in nearest["police_station"] or "Noida" in nearest["police_station"]


def test_routing_to_incident():
    start_lat = 28.5830  # Noida Sector 20 PS
    start_lon = 77.3320
    incident_lat = 28.1402  # Yamuna Expressway Toll KM 48
    incident_lon = 77.5510

    route = calculate_osrm_route(start_lat, start_lon, incident_lat, incident_lon)
    assert route["status"] == "SUCCESS"
    assert route["distance_km"] > 0
    assert route["duration_minutes"] > 0
    assert len(route["coordinates"]) >= 2
    # Verify GeoJSON coordinates format: list of [longitude, latitude]
    first_pt = route["coordinates"][0]
    assert len(first_pt) == 2
    assert isinstance(first_pt[0], (int, float))
    assert isinstance(first_pt[1], (int, float))


def test_geo_nearest_station_api_endpoint():
    # Test GET /api/v1/geo/nearest-station
    response = client.get("/api/v1/geo/nearest-station?lat=28.1402&lon=77.5510&top_k=2")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["nearest_station"] is not None
    assert len(data["stations"]) == 2
    assert data["nearest_station"]["distance_km"] < 5.0


def test_geo_route_to_incident_api_endpoint():
    # Test POST /api/v1/geo/route-to-incident for suspect location 3km away from nearest station
    payload = {
        "incident_lat": 28.1650,
        "incident_lon": 77.5600
    }
    response = client.post("/api/v1/geo/route-to-incident", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["distance_km"] > 0
    assert data["duration_minutes"] > 0
    assert "police_station" in data
    assert len(data["coordinates"]) >= 2
