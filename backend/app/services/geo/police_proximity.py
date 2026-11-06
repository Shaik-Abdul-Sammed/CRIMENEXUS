import os
import math
import logging
import requests
from typing import Dict, Any, List, Optional
from app.ml_service.dataset_registry import get_all_osm_police_stations

logger = logging.getLogger("crimenexus.geo.proximity")

OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "http://osrm:5000")
OSRM_PUBLIC_DEMO_URL = "http://router.project-osrm.org/route/v1/driving"


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


DEFAULT_CRITICAL_STATIONS = [
    {"name": "Jewar Police Station (Yamuna Expressway Jurisdiction)", "state": "Uttar Pradesh", "district": "JEWAR_NOIDA", "latitude": 28.1285, "longitude": 77.5562},
    {"name": "Rabupura Police Station", "state": "Uttar Pradesh", "district": "JEWAR_NOIDA", "latitude": 28.2435, "longitude": 77.6020},
    {"name": "Noida Sector 20 Police Station", "state": "Uttar Pradesh", "district": "NOIDA", "latitude": 28.5830, "longitude": 77.3320},
    {"name": "Noida Sector 62 Police Post", "state": "Uttar Pradesh", "district": "NOIDA", "latitude": 28.6280, "longitude": 77.3649},
    {"name": "Connaught Place Police Station", "state": "Delhi", "district": "DELHI_CENTRAL", "latitude": 28.6328, "longitude": 77.2197},
    {"name": "Parliament Street Police Station", "state": "Delhi", "district": "DELHI_CENTRAL", "latitude": 28.6231, "longitude": 77.2140},
    {"name": "Hauz Khas Police Station", "state": "Delhi", "district": "DELHI_SOUTH", "latitude": 28.5482, "longitude": 77.2045},
    {"name": "Cyber Hub Police Post Gurugram", "state": "Haryana", "district": "GURUGRAM", "latitude": 28.4950, "longitude": 77.0895},
]


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
        try:
            stations_pool = get_all_osm_police_stations()
        except Exception:
            stations_pool = []

    # Merge critical operational stations
    combined_stations = list(stations_pool)
    seen_names = {s.get("name") or s.get("police_station") for s in combined_stations}
    for def_stn in DEFAULT_CRITICAL_STATIONS:
        if def_stn["name"] not in seen_names:
            combined_stations.append(def_stn)
            seen_names.add(def_stn["name"])

    scored_stations = []
    for stn in combined_stations:
        stn_name = stn.get("name") or stn.get("police_station", "Police Station")
        # Ignore checkpoint node at distance 0 if operational stations are available
        if "Checkpoint" in stn_name and math.hypot(float(stn["latitude"]) - latitude, float(stn["longitude"]) - longitude) < 0.001:
            continue

        stn_lat = float(stn["latitude"])
        stn_lon = float(stn["longitude"])
        dist_km = haversine_distance_km(latitude, longitude, stn_lat, stn_lon)

        if max_radius_km is not None and dist_km > max_radius_km:
            continue

        scored_stations.append({
            "police_station": stn_name,
            "state": stn.get("state", "India"),
            "district": stn.get("district", "METRO"),
            "station_latitude": stn_lat,
            "station_longitude": stn_lon,
            "distance_km": round(dist_km, 2),
            "distance_meters": int(round(dist_km * 1000.0)),
        })

    scored_stations.sort(key=lambda s: s["distance_km"])
    if not scored_stations and max_radius_km is not None:
        # Fall back to nationwide spatial index (18,000+ OSM stations)
        try:
            from app.services.geo.station_loader import get_station_spatial_index
            spatial_index = get_station_spatial_index()
            nationwide_res = spatial_index.find_nearest_station(latitude, longitude, top_k=top_k, max_radius_km=max_radius_km)
            for stn in nationwide_res:
                scored_stations.append({
                    "police_station": stn["name"],
                    "state": stn["state"],
                    "district": stn["district"],
                    "station_latitude": stn["latitude"],
                    "station_longitude": stn["longitude"],
                    "distance_km": stn["distance_km"],
                    "distance_meters": stn["distance_meters"]
                })
        except Exception as exc:
            logger.warning("Nationwide station spatial index fallback error: %s", exc)

    return scored_stations[:top_k]


def calculate_osrm_route(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float
) -> Dict[str, Any]:
    """
    Calculates the road network shortest path and estimated travel time using self-hosted OSRM
    (Open Source Routing Machine), with fallback to public demo API, and finally to air-gapped geodesic.
    """
    candidate_urls = []
    if OSRM_BASE_URL:
        # Self-hosted OSRM container endpoint
        candidate_urls.append(
            (f"{OSRM_BASE_URL.rstrip('/')}/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson", "OSRM-Self-Hosted")
        )
    candidate_urls.append(
        (f"{OSRM_PUBLIC_DEMO_URL}/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson", "OSRM-Public-Demo")
    )

    for url, engine_name in candidate_urls:
        try:
            response = requests.get(url, timeout=2.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    distance_km = round(route["distance"] / 1000.0, 2)
                    duration_min = round(route["duration"] / 60.0, 1)
                    geometry = route["geometry"]
                    return {
                        "status": "SUCCESS",
                        "routing_engine": engine_name,
                        "distance_km": distance_km,
                        "duration_minutes": duration_min,
                        "coordinates": geometry.get("coordinates", []),
                        "summary": f"Fastest police intercept route via road network ({engine_name}): {distance_km} km ({duration_min} mins)",
                    }
        except Exception as exc:
            logger.info("OSRM routing attempt via %s unavailable (%s); checking next route engine", engine_name, exc)

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
