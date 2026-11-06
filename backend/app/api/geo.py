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
