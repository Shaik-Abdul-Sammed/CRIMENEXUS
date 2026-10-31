import math
import logging
import requests
from typing import Dict, Any, List, Optional, Tuple
from app.ml_service.dataset_registry import get_all_osm_police_stations

logger = logging.getLogger("crimenexus.geo.proximity")

OSRM_PUBLIC_API_URL = "http://router.project-osrm.org/route/v1/driving"


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates on Earth using Haversine formula.
    """
    r_earth = 6371.0  # Earth radius in kilometers
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r_earth * c


def find_nearest_police_stations(
    latitude: float,
    longitude: float,
    top_k: int = 3,
    max_radius_km: Optional[float] = None,
    stations_pool: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Identifies the closest jurisdictional police stations to any incident, crime scene,
    or suspect vehicle ANPR sighting.
    """
    if stations_pool is None:
        stations_pool = get_all_osm_police_stations()

    scored_stations = []
    for stn in stations_pool:
        stn_lat = float(stn["latitude"])
        stn_lon = float(stn["longitude"])
        dist_km = haversine_distance_km(latitude, longitude, stn_lat, stn_lon)

        if max_radius_km is not None and dist_km > max_radius_km:
            continue

        scored_stations.append({
            "police_station": stn["name"],
            "state": stn.get("state", "India"),
            "district": stn.get("district", "METRO"),
            "station_latitude": stn_lat,
            "station_longitude": stn_lon,
            "distance_km": round(dist_km, 2),
            "distance_meters": int(round(dist_km * 1000.0)),
        })

    scored_stations.sort(key=lambda s: s["distance_km"])
    return scored_stations[:top_k]


def calculate_osrm_route(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float
) -> Dict[str, Any]:
    """
    Calculates the road network shortest path and estimated travel time using OSRM
    (Open Source Routing Machine). Falls back to geodesic urban road routing if offline.
    """
    url = f"{OSRM_PUBLIC_API_URL}/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson"
    try:
        response = requests.get(url, timeout=2.5)
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == "Ok" and data.get("routes"):
                route = data["routes"][0]
                distance_km = round(route["distance"] / 1000.0, 2)
                duration_min = round(route["duration"] / 60.0, 1)
                geometry = route["geometry"]
                return {
                    "status": "SUCCESS",
                    "routing_engine": "OSRM-Live-Road-Network",
                    "distance_km": distance_km,
                    "duration_minutes": duration_min,
                    "coordinates": geometry.get("coordinates", []),
                    "summary": f"Fastest police intercept route via road network: {distance_km} km ({duration_min} mins)",
                }
    except Exception as exc:
        logger.info("OSRM live routing endpoint unavailable (%s); activating air-gapped geodesic route model", exc)

    # Air-Gapped Resilient Geodesic Fallback:
    # Uses Haversine with standard Indian urban road winding tortuosity factor (1.35x)
    # and emergency vehicle average transit velocity of 42 km/h
    direct_dist_km = haversine_distance_km(start_lat, start_lon, end_lat, end_lon)
    road_dist_km = max(0.25, round(direct_dist_km * 1.35, 2))
    transit_duration_min = max(0.5, round((road_dist_km / 42.0) * 60.0, 1))

    # Generate realistic interpolated waypoint coordinates between station and incident
    steps = 10
    coords = []
    for i in range(steps + 1):
        frac = i / float(steps)
        curr_lat = start_lat + (end_lat - start_lat) * frac
        curr_lon = start_lon + (end_lon - start_lon) * frac
        # Mild road curvature offset for visual realism
        if 0 < i < steps:
            curr_lat += math.sin(frac * math.pi) * 0.003
            curr_lon += math.cos(frac * math.pi) * 0.003
        coords.append([round(curr_lon, 5), round(curr_lat, 5)])

    return {
        "status": "SUCCESS",
        "routing_engine": "CRIMENEXUS-Air-Gapped-Geodesic",
        "distance_km": road_dist_km,
        "duration_minutes": max(1.0, transit_duration_min),
        "coordinates": coords,
        "summary": f"Air-gapped emergency response intercept trajectory: {road_dist_km} km (~{transit_duration_min} mins)",
    }
