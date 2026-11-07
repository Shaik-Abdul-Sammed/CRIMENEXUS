import logging
from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse

from app.api.analytics import get_nearest_police_station, route_to_incident, RouteToIncidentRequest
from app.services.geo.map_generator import generate_tactical_leaflet_html, generate_folium_map_html

logger = logging.getLogger("crimenexus.api.geo")

router = APIRouter(prefix="/geo", tags=["Geospatial & Police Proximity"])

@router.get("/nearest-station", summary="Find Nearest Police Station(s)")
def get_nearest_station_endpoint(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    top_k: int = Query(3, description="Number of stations"),
    max_radius_km: Optional[float] = Query(None, description="Max radius in km")
):
    return get_nearest_police_station(lat=lat, lon=lon, top_k=top_k, max_radius_km=max_radius_km)

@router.post("/route-to-incident", summary="Calculate Road Network Intercept Route via OSRM")
def calculate_route_endpoint(payload: RouteToIncidentRequest):
    return route_to_incident(payload)

@router.get("/tactical-map", response_class=HTMLResponse, summary="Interactive Python GIS Tactical Map")
def get_tactical_map_view(
    lat: float = Query(28.5850, description="Center latitude"),
    lon: float = Query(77.3180, description="Center longitude"),
    zoom: int = Query(13, description="Initial zoom level"),
    case_id: str = Query("CASE-2026-8812", description="Target case ID"),
    vehicle: str = Query("TS 09 AB 1234 (Black Mahindra Scorpio)", description="Target vehicle description"),
    engine: str = Query("auto", description="GIS Engine: 'auto', 'leaflet', or 'folium'")
):
    """
    Renders an interactive Python Leaflet & Folium GIS map.
    Zero external paid API keys required. Air-gapped & resilient against 3rd-party tile blocking.
    """
    if engine == "folium":
        html = generate_folium_map_html(
            center_lat=lat,
            center_lon=lon,
            zoom=zoom,
            case_id=case_id,
            target_vehicle=vehicle
        )
    else:
        html = generate_tactical_leaflet_html(
            center_lat=lat,
            center_lon=lon,
            zoom=zoom,
            case_id=case_id,
            target_vehicle=vehicle
        )
    return HTMLResponse(content=html, status_code=200)

@router.get("/map-view", response_class=HTMLResponse, summary="Alias for Python Tactical Map View")
def get_map_view_alias(
    lat: float = Query(28.6139, description="Center latitude"),
    lon: float = Query(77.2090, description="Center longitude"),
    zoom: int = Query(12, description="Initial zoom level"),
    case_id: str = Query("CASE-2026-8812", description="Target case ID")
):
    return get_tactical_map_view(lat=lat, lon=lon, zoom=zoom, case_id=case_id)


# Local pre-indexed locations for instant, air-gapped zero-latency place lookup
LOCAL_PLACES_CATALOG = [
    {"name": "RGUKT RK Valley", "lat": 14.3338, "lon": 78.5385, "type": "University / Institute", "state": "Andhra Pradesh", "display_name": "RGUKT RK Valley, Idupulapaya, Vempalli, Kadapa, AP"},
    {"name": "RGUKT Nuzvid", "lat": 16.7909, "lon": 80.8465, "type": "University / Institute", "state": "Andhra Pradesh", "display_name": "RGUKT Nuzvid, Eluru District, Andhra Pradesh"},
    {"name": "RGUKT Srikakulam", "lat": 18.2949, "lon": 83.8967, "type": "University / Institute", "state": "Andhra Pradesh", "display_name": "RGUKT Srikakulam, Etcherla, Andhra Pradesh"},
    {"name": "RGUKT Ongole", "lat": 15.5057, "lon": 80.0442, "type": "University / Institute", "state": "Andhra Pradesh", "display_name": "RGUKT Ongole Campus, Prakasam District, Andhra Pradesh"},
    {"name": "RGUKT Basar", "lat": 18.8792, "lon": 77.9236, "type": "University / Institute", "state": "Telangana", "display_name": "RGUKT Basar, Nirmal District, Telangana"},
    {"name": "Tirupati City Center", "lat": 13.6288, "lon": 79.4192, "type": "City", "state": "Andhra Pradesh", "display_name": "Tirupati, Chittoor/Tirupati District, Andhra Pradesh"},
    {"name": "Chittoor Police Headquarters", "lat": 13.2172, "lon": 79.1003, "type": "Police HQ", "state": "Andhra Pradesh", "display_name": "District Police Headquarters, Chittoor, Andhra Pradesh"},
    {"name": "Sri City Special Economic Zone", "lat": 13.5500, "lon": 80.0300, "type": "Industrial Corridor", "state": "Andhra Pradesh", "display_name": "Sri City, Satyavedu, Tirupati District, Andhra Pradesh"},
    {"name": "Vijayawada Benz Circle", "lat": 16.5062, "lon": 80.6480, "type": "City Hub", "state": "Andhra Pradesh", "display_name": "Benz Circle, Vijayawada, NTR District, Andhra Pradesh"},
    {"name": "Visakhapatnam Police Commissionerate", "lat": 17.6868, "lon": 83.2185, "type": "City / Commissionrate", "state": "Andhra Pradesh", "display_name": "Visakhapatnam City, Andhra Pradesh"},
    {"name": "Jewar Police Station (Yamuna Jurisdiction)", "lat": 28.1285, "lon": 77.5562, "type": "Police Station", "state": "Uttar Pradesh", "display_name": "Jewar PS, Yamuna Expressway, Gautam Buddha Nagar, UP"},
    {"name": "Yamuna Expressway Toll Plaza KM 48", "lat": 28.1402, "lon": 77.5510, "type": "Incident Zone", "state": "Uttar Pradesh", "display_name": "Toll KM 48, Yamuna Expressway, Jewar Corridor, UP"},
    {"name": "Noida Sector 20 Police Station", "lat": 28.5815, "lon": 77.3308, "type": "Police Station", "state": "Uttar Pradesh", "display_name": "Noida Sector 20 PS, Gautam Buddha Nagar, UP"},
    {"name": "Noida Sector 62 IT Hub", "lat": 28.6280, "lon": 77.3620, "type": "IT Corridor", "state": "Uttar Pradesh", "display_name": "Sector 62 IT Hub, Electronic City, Noida, UP"},
    {"name": "Connaught Place (Central Delhi)", "lat": 28.6328, "lon": 77.2197, "type": "City Center", "state": "Delhi", "display_name": "Connaught Place, New Delhi, Delhi 110001"},
    {"name": "Parliament Street Police Station", "lat": 28.6231, "lon": 77.2140, "type": "Police Station", "state": "Delhi", "display_name": "Parliament Street PS, New Delhi, Delhi"},
    {"name": "Cyber Hub Gurugram Police Post", "lat": 28.4950, "lon": 77.0895, "type": "Police Post", "state": "Haryana", "display_name": "Cyber Hub, DLF Phase 2, Gurugram, Haryana"},
    {"name": "Mathura Highway Toll Police Post", "lat": 27.6520, "lon": 77.6850, "type": "Highway Police Post", "state": "Uttar Pradesh", "display_name": "Mathura Highway Toll Post, NH-19 Corridor, UP"},
    {"name": "Agra Ring Road Toll Plaza", "lat": 27.1767, "lon": 78.0081, "type": "Highway Toll", "state": "Uttar Pradesh", "display_name": "Agra Expressway Toll, Agra, UP"},
    {"name": "Hyderabad / Hitec City", "lat": 17.4474, "lon": 78.3804, "type": "Metro City", "state": "Telangana", "display_name": "Hitec City, Cyberabad, Hyderabad, Telangana"},
    {"name": "Bengaluru Central (MG Road)", "lat": 12.9716, "lon": 77.5946, "type": "Metro City", "state": "Karnataka", "display_name": "MG Road, Bengaluru, Karnataka"},
    {"name": "Chennai Central Railway Station", "lat": 13.0827, "lon": 80.2707, "type": "Metro City", "state": "Tamil Nadu", "display_name": "Chennai Central, Chennai, Tamil Nadu"},
    {"name": "Mumbai Police HQ (Crawford Market)", "lat": 18.9470, "lon": 72.8340, "type": "Police HQ", "state": "Maharashtra", "display_name": "Mumbai Police Commissionerate, Fort, Mumbai"},
    {"name": "Kolkata Lalbazar Police HQ", "lat": 22.5726, "lon": 88.3639, "type": "Police HQ", "state": "West Bengal", "display_name": "Lalbazar Police HQ, Bowbazar, Kolkata, West Bengal"},
    {"name": "IGI International Airport (DEL)", "lat": 28.5562, "lon": 77.1000, "type": "Airport", "state": "Delhi", "display_name": "Indira Gandhi International Airport, New Delhi"},
]

@router.get("/search-places", summary="Type-ahead Location & Address Geocoding Search")
async def search_places_endpoint(
    q: str = Query(..., min_length=1, description="Location search query or coordinates")
):
    """
    Search places by name, landmark, town, university, police station, or coordinates (lat, lon).
    Returns instant matching coordinates with distance to active target.
    """
    import re
    import httpx

    query = q.strip()
    results = []

    # 1. Check if user typed coordinates like "13.6288, 79.4192" or "28.1402 77.5510"
    coord_pattern = r"^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)[,\s]+[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$"
    if re.match(coord_pattern, query):
        parts = re.split(r"[,\s]+", query)
        try:
            c_lat = float(parts[0])
            c_lon = float(parts[1])
            results.append({
                "name": f"Coordinates: {c_lat:.5f}°N, {c_lon:.5f}°E",
                "lat": c_lat,
                "lon": c_lon,
                "type": "Custom GPS Coordinates",
                "state": "Direct Coordinate Input",
                "display_name": f"Exact Geodetic Pinpoint [{c_lat:.5f}, {c_lon:.5f}]"
            })
        except Exception:
            pass

    # 2. Match local fast index (case-insensitive substring)
    q_lower = query.lower()
    for place in LOCAL_PLACES_CATALOG:
        if (
            q_lower in place["name"].lower()
            or q_lower in place["display_name"].lower()
            or q_lower in place["state"].lower()
            or q_lower in place["type"].lower()
        ):
            results.append(place)

    # 3. If online and query has >= 2 letters, query OpenStreetMap Nominatim for Indian & global places
    if len(query) >= 2 and len(results) < 8:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                headers = {"User-Agent": "CrimeNexus-Tactical-GIS/1.0 (contact@crimenexus.gov.in)"}
                resp = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={
                        "format": "json",
                        "q": query,
                        "countrycodes": "in",
                        "limit": 6,
                        "addressdetails": 1
                    },
                    headers=headers
                )
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data:
                        try:
                            n_lat = float(item["lat"])
                            n_lon = float(item["lon"])
                            # Avoid duplicates with local index
                            if any(abs(r["lat"] - n_lat) < 0.005 and abs(r["lon"] - n_lon) < 0.005 for r in results):
                                continue
                            results.append({
                                "name": item.get("name") or item.get("display_name", "").split(",")[0],
                                "lat": n_lat,
                                "lon": n_lon,
                                "type": item.get("type", "Location").capitalize(),
                                "state": item.get("address", {}).get("state", "India"),
                                "display_name": item.get("display_name", "")
                            })
                        except Exception:
                            continue
        except Exception as e:
            logger.debug(f"Nominatim lookup skipped or timed out: {e}")

    return {"query": query, "count": len(results), "results": results[:10]}
