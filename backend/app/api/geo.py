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


# Comprehensive Pan-India pre-indexed locations for instant, air-gapped zero-latency place lookup across all states
LOCAL_PLACES_CATALOG = [
    # Andhra Pradesh & Telangana
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
    {"name": "Guntur City Police Office", "lat": 16.3067, "lon": 80.4365, "type": "Police HQ", "state": "Andhra Pradesh", "display_name": "Guntur City, Andhra Pradesh"},
    {"name": "Nellore District Police HQ", "lat": 14.4426, "lon": 79.9865, "type": "Police HQ", "state": "Andhra Pradesh", "display_name": "Nellore District HQ, Andhra Pradesh"},
    {"name": "Kurnool Police Command Control", "lat": 15.8281, "lon": 78.0373, "type": "Police HQ", "state": "Andhra Pradesh", "display_name": "Kurnool City, Andhra Pradesh"},
    {"name": "Kadapa District Police HQ", "lat": 14.4673, "lon": 78.8242, "type": "Police HQ", "state": "Andhra Pradesh", "display_name": "Kadapa (YSR District), Andhra Pradesh"},
    {"name": "Anantapur Police HQ", "lat": 14.6819, "lon": 77.6006, "type": "Police HQ", "state": "Andhra Pradesh", "display_name": "Anantapur City, Andhra Pradesh"},
    {"name": "Hyderabad / Hitec City", "lat": 17.4474, "lon": 78.3804, "type": "Metro City", "state": "Telangana", "display_name": "Hitec City, Cyberabad, Hyderabad, Telangana"},
    {"name": "Hyderabad Police Commissionerate (Basheerbagh)", "lat": 17.4019, "lon": 78.4770, "type": "Police HQ", "state": "Telangana", "display_name": "Hyderabad City Police Commissionerate, Telangana"},
    {"name": "Warangal Police Commissionerate", "lat": 17.9689, "lon": 79.5941, "type": "Police HQ", "state": "Telangana", "display_name": "Warangal, Telangana"},

    # NCR, Uttar Pradesh & Haryana
    {"name": "Jewar Police Station (Yamuna Jurisdiction)", "lat": 28.1285, "lon": 77.5562, "type": "Police Station", "state": "Uttar Pradesh", "display_name": "Jewar PS, Yamuna Expressway, Gautam Buddha Nagar, UP"},
    {"name": "Yamuna Expressway Toll Plaza KM 48", "lat": 28.1402, "lon": 77.5510, "type": "Incident Zone", "state": "Uttar Pradesh", "display_name": "Toll KM 48, Yamuna Expressway, Jewar Corridor, UP"},
    {"name": "Noida Sector 20 Police Station", "lat": 28.5815, "lon": 77.3308, "type": "Police Station", "state": "Uttar Pradesh", "display_name": "Noida Sector 20 PS, Gautam Buddha Nagar, UP"},
    {"name": "Noida Sector 62 IT Hub", "lat": 28.6280, "lon": 77.3620, "type": "IT Corridor", "state": "Uttar Pradesh", "display_name": "Sector 62 IT Hub, Electronic City, Noida, UP"},
    {"name": "Connaught Place (Central Delhi)", "lat": 28.6328, "lon": 77.2197, "type": "City Center", "state": "Delhi", "display_name": "Connaught Place, New Delhi, Delhi 110001"},
    {"name": "Parliament Street Police Station", "lat": 28.6231, "lon": 77.2140, "type": "Police Station", "state": "Delhi", "display_name": "Parliament Street PS, New Delhi, Delhi"},
    {"name": "Cyber Hub Gurugram Police Post", "lat": 28.4950, "lon": 77.0895, "type": "Police Post", "state": "Haryana", "display_name": "Cyber Hub, DLF Phase 2, Gurugram, Haryana"},
    {"name": "Mathura Highway Toll Police Post", "lat": 27.6520, "lon": 77.6850, "type": "Highway Police Post", "state": "Uttar Pradesh", "display_name": "Mathura Highway Toll Post, NH-19 Corridor, UP"},
    {"name": "Agra Ring Road Toll Plaza", "lat": 27.1767, "lon": 78.0081, "type": "Highway Toll", "state": "Uttar Pradesh", "display_name": "Agra Expressway Toll, Agra, UP"},
    {"name": "Lucknow Police HQ (Signature Building)", "lat": 26.8467, "lon": 80.9462, "type": "Police HQ", "state": "Uttar Pradesh", "display_name": "UP Police Headquarters, Gomti Nagar, Lucknow, UP"},
    {"name": "Kanpur Police Commissionerate", "lat": 26.4499, "lon": 80.3319, "type": "Police HQ", "state": "Uttar Pradesh", "display_name": "Kanpur Nagar, Uttar Pradesh"},
    {"name": "Varanasi Police Commissionerate", "lat": 25.3176, "lon": 82.9739, "type": "Police HQ", "state": "Uttar Pradesh", "display_name": "Varanasi City, Uttar Pradesh"},
    {"name": "Prayagraj Police HQ", "lat": 25.4358, "lon": 81.8463, "type": "Police HQ", "state": "Uttar Pradesh", "display_name": "Civil Lines, Prayagraj, UP"},

    # Major Indian Metros & State Capitals
    {"name": "Bengaluru Central (MG Road)", "lat": 12.9716, "lon": 77.5946, "type": "Metro City", "state": "Karnataka", "display_name": "MG Road, Bengaluru, Karnataka"},
    {"name": "Bengaluru Police Commissionerate (Infantry Rd)", "lat": 12.9806, "lon": 77.5986, "type": "Police HQ", "state": "Karnataka", "display_name": "Infantry Road, Bengaluru City Police HQ, Karnataka"},
    {"name": "Chennai Central Railway Station", "lat": 13.0827, "lon": 80.2707, "type": "Metro City", "state": "Tamil Nadu", "display_name": "Chennai Central, Chennai, Tamil Nadu"},
    {"name": "Greater Chennai Police Commissionerate (Vepery)", "lat": 13.0847, "lon": 80.2618, "type": "Police HQ", "state": "Tamil Nadu", "display_name": "EVK Sampath Road, Vepery, Chennai, Tamil Nadu"},
    {"name": "Mumbai Police HQ (Crawford Market)", "lat": 18.9470, "lon": 72.8340, "type": "Police HQ", "state": "Maharashtra", "display_name": "Mumbai Police Commissionerate, Fort, Mumbai, Maharashtra"},
    {"name": "Pune Police Commissionerate", "lat": 18.5204, "lon": 73.8567, "type": "Police HQ", "state": "Maharashtra", "display_name": "Pune City Police HQ, Maharashtra"},
    {"name": "Nagpur Police Commissionerate", "lat": 21.1458, "lon": 79.0882, "type": "Police HQ", "state": "Maharashtra", "display_name": "Nagpur City Police, Maharashtra"},
    {"name": "Kolkata Lalbazar Police HQ", "lat": 22.5726, "lon": 88.3639, "type": "Police HQ", "state": "West Bengal", "display_name": "Lalbazar Police HQ, Bowbazar, Kolkata, West Bengal"},
    {"name": "Ahmedabad Police Commissionerate (Shahibaug)", "lat": 23.0225, "lon": 72.5714, "type": "Police HQ", "state": "Gujarat", "display_name": "Shahibaug, Ahmedabad, Gujarat"},
    {"name": "Surat Police Commissionerate", "lat": 21.1702, "lon": 72.8311, "type": "Police HQ", "state": "Gujarat", "display_name": "Athwa Lines, Surat, Gujarat"},
    {"name": "Jaipur Police Commissionerate (MI Road)", "lat": 26.9124, "lon": 75.7873, "type": "Police HQ", "state": "Rajasthan", "display_name": "MI Road, Jaipur City Police, Rajasthan"},
    {"name": "Bhopal Police HQ (Jahangirabad)", "lat": 23.2599, "lon": 77.4126, "type": "Police HQ", "state": "Madhya Pradesh", "display_name": "MP Police Headquarters, Bhopal, Madhya Pradesh"},
    {"name": "Indore Police Commissionerate", "lat": 22.7196, "lon": 75.8577, "type": "Police HQ", "state": "Madhya Pradesh", "display_name": "Indore City, Madhya Pradesh"},
    {"name": "Patna Police Control Room", "lat": 25.5941, "lon": 85.1376, "type": "Police HQ", "state": "Bihar", "display_name": "Gandhi Maidan, Patna, Bihar"},
    {"name": "Ranchi Police HQ", "lat": 23.3441, "lon": 85.3096, "type": "Police HQ", "state": "Jharkhand", "display_name": "Ranchi City, Jharkhand"},
    {"name": "Bhubaneswar Police Commissionerate", "lat": 20.2961, "lon": 85.8245, "type": "Police HQ", "state": "Odisha", "display_name": "Vani Vihar, Bhubaneswar, Odisha"},
    {"name": "Chandigarh Police HQ (Sector 9)", "lat": 30.7333, "lon": 76.7794, "type": "Police HQ", "state": "Chandigarh", "display_name": "Sector 9, Chandigarh Police HQ, UT"},
    {"name": "Amritsar Police Commissionerate", "lat": 31.6340, "lon": 74.8723, "type": "Police HQ", "state": "Punjab", "display_name": "Amritsar City, Punjab"},
    {"name": "Kochi City Police Commissionerate", "lat": 9.9312, "lon": 76.2673, "type": "Police HQ", "state": "Kerala", "display_name": "Marine Drive, Kochi, Kerala"},
    {"name": "Thiruvananthapuram Police HQ", "lat": 8.5241, "lon": 76.9366, "type": "Police HQ", "state": "Kerala", "display_name": "Kerala Police HQ, Vazhuthacaud, Thiruvananthapuram, Kerala"},
    {"name": "Guwahati Police Commissionerate", "lat": 26.1445, "lon": 91.7362, "type": "Police HQ", "state": "Assam", "display_name": "Panbazar, Guwahati, Assam"},
    {"name": "Dehradun Police HQ", "lat": 30.3165, "lon": 78.0322, "type": "Police HQ", "state": "Uttarakhand", "display_name": "Uttarakhand Police HQ, Dehradun"},
    {"name": "Shimla Police HQ", "lat": 31.1048, "lon": 77.1734, "type": "Police HQ", "state": "Himachal Pradesh", "display_name": "Shimla, Himachal Pradesh"},
    {"name": "Srinagar Police Control Room", "lat": 34.0837, "lon": 74.7973, "type": "Police HQ", "state": "Jammu & Kashmir", "display_name": "Batmaloo, Srinagar, Jammu & Kashmir"},
    {"name": "Jammu District Police HQ", "lat": 32.7266, "lon": 74.8570, "type": "Police HQ", "state": "Jammu & Kashmir", "display_name": "Jammu City, Jammu & Kashmir"},
    {"name": "Raipur Police HQ", "lat": 21.2514, "lon": 81.6296, "type": "Police HQ", "state": "Chhattisgarh", "display_name": "Nawa Raipur, Chhattisgarh"},
    {"name": "Panaji Police HQ", "lat": 15.4909, "lon": 73.8278, "type": "Police HQ", "state": "Goa", "display_name": "Altinho, Panaji, Goa"},
    {"name": "IGI International Airport (DEL)", "lat": 28.5562, "lon": 77.1000, "type": "Airport", "state": "Delhi", "display_name": "Indira Gandhi International Airport, New Delhi"},
]

@router.get("/search-places", summary="Type-ahead Pan-India Location & Address Geocoding Search")
async def search_places_endpoint(
    q: str = Query(..., min_length=1, description="Location search query or coordinates (India Only)")
):
    """
    Search places strictly across India by city, district, town, university, landmark, police station, or coordinates (lat, lon).
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
                "state": "India Geodetic Grid",
                "display_name": f"Exact Geodetic Pinpoint [{c_lat:.5f}, {c_lon:.5f}], India"
            })
        except Exception:
            pass

    # 2. Match local fast index for Indian cities, campuses, and police stations (case-insensitive substring)
    q_lower = query.lower()
    for place in LOCAL_PLACES_CATALOG:
        if (
            q_lower in place["name"].lower()
            or q_lower in place["display_name"].lower()
            or q_lower in place["state"].lower()
            or q_lower in place["type"].lower()
        ):
            results.append(place)

    # 3. Fast high-concurrency Pan-India geocoder: Photon API biased to India (lat=22.59, lon=78.96)
    if len(query) >= 2 and len(results) < 12:
        try:
            async with httpx.AsyncClient(timeout=2.5) as client:
                photon_resp = await client.get(
                    "https://photon.komoot.io/api/",
                    params={
                        "q": query,
                        "lat": 22.5937,
                        "lon": 78.9629,
                        "limit": 10
                    }
                )
                if photon_resp.status_code == 200:
                    features = photon_resp.json().get("features", [])
                    for feat in features:
                        props = feat.get("properties", {})
                        # Strictly enforce India only
                        if props.get("country") != "India":
                            continue
                        geom = feat.get("geometry", {})
                        coords = geom.get("coordinates", [])
                        if len(coords) >= 2:
                            p_lon = float(coords[0])
                            p_lat = float(coords[1])
                            # Prevent duplicates
                            if any(abs(r["lat"] - p_lat) < 0.005 and abs(r["lon"] - p_lon) < 0.005 for r in results):
                                continue
                            place_name = props.get("name") or props.get("city") or props.get("district") or query
                            state_name = props.get("state") or "India"
                            district_name = props.get("district") or props.get("city") or ""
                            display = f"{place_name}{f', {district_name}' if district_name and district_name != place_name else ''}, {state_name}, India"
                            results.append({
                                "name": place_name,
                                "lat": p_lat,
                                "lon": p_lon,
                                "type": props.get("type", "Location").capitalize(),
                                "state": state_name,
                                "display_name": display
                            })
        except Exception as e:
            logger.debug(f"Photon India lookup skipped or timed out: {e}")

    # 4. Fallback to OpenStreetMap Nominatim strictly scoped to India (countrycodes=in)
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
                        "limit": 8,
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
                            # Avoid duplicates with local and Photon results
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
            logger.debug(f"Nominatim India lookup skipped or timed out: {e}")

    return {"query": query, "count": len(results), "scope": "India Only", "results": results[:15]}
