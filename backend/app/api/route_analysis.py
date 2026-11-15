import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.services.graph.route_analyzer import get_route_analyzer
from app.database.postgres import SessionLocal
from app.models.case import Case
from app.models.vehicle_sighting import VehicleSighting

logger = logging.getLogger("crimenexus.route_analysis")

router = APIRouter(tags=["Crime Pattern Theory Route Analysis"])

class AnchorNode(BaseModel):
    id: str
    label: str # Residence, Work, Hangout
    lat: float
    lon: float

class CrimePoint(BaseModel):
    id: str
    offense: str
    lat: float
    lon: float

class RouteAnalysisRequest(BaseModel):
    offender_id: str
    anchor_nodes: List[AnchorNode]
    crime_events: List[CrimePoint]
    buffer_radius_km: float = 2.0

@router.get("/route-analysis/health", summary="Route Analysis Health Check")
@router.get("/route/health", summary="Route Health Check")
def route_analysis_health():
    analyzer = get_route_analyzer()
    return {
        "status": "healthy",
        "service": "Crime Pattern Theory Route Analysis (Brantingham)",
        "features": ["Awareness Space Buffering", "Corridor Projection", "Directional Bias Scoring", "Scipy Voronoi Tessellation"],
        "model_engine": analyzer.engine,
        "version": "1.0.0"
    }

@router.get("/route-analysis", summary="Scipy Voronoi Spatial Crime Partitioning")
@router.get("/route-analysis/", summary="Scipy Voronoi Spatial Crime Partitioning")
@router.get("/route/analysis", summary="Scipy Voronoi Spatial Crime Partitioning")
def get_voronoi_route_analysis():
    analyzer = get_route_analyzer()
    db = SessionLocal()
    try:
        from app.models.person import Person
        cases_list = []
        if hasattr(Case, "latitude"):
            try:
                cases_list = db.query(Case).filter(getattr(Case, "latitude").isnot(None)).limit(20).all()
            except Exception:
                cases_list = []

        if not cases_list:
            try:
                sightings = db.query(VehicleSighting).filter(VehicleSighting.latitude.isnot(None)).limit(20).all()
                cases_list = [{"latitude": s.latitude, "longitude": s.longitude} for s in sightings]
            except Exception:
                cases_list = []

        if len(cases_list) < 4:
            cases_list = [
                {"latitude": 28.6350, "longitude": 77.0920},
                {"latitude": 28.6510, "longitude": 77.1350},
                {"latitude": 28.6520, "longitude": 77.1750},
                {"latitude": 28.6480, "longitude": 77.1850},
                {"latitude": 28.5355, "longitude": 77.2600}
            ]

        persons_list = []
        try:
            db_persons = db.query(Person).limit(10).all()
            for p in db_persons:
                p_lat = getattr(p, "latitude", None)
                p_lon = getattr(p, "longitude", None)
                if p_lat is not None and p_lon is not None:
                    persons_list.append(p)
                else:
                    persons_list.append({
                        "id": p.id,
                        "name": p.name,
                        "latitude": 28.6400 + ((p.id or 1) * 0.005),
                        "longitude": 77.1200 + ((p.id or 1) * 0.005)
                    })
        except Exception:
            persons_list = []

        if not persons_list:
            persons_list = [
                {"id": 1, "name": "Vikram Malhotra", "latitude": 28.6400, "longitude": 77.1200},
                {"id": 2, "name": "Rajan Sharma", "latitude": 28.6500, "longitude": 77.1600}
            ]
        return analyzer.analyze(cases_list, persons_list)
    finally:
        db.close()

@router.post("/route/analyze", summary="Analyze Offender Awareness Space & Crime Corridors")
@router.post("/route-analysis/analyze", summary="Analyze Offender Awareness Space & Crime Corridors")
def analyze_crime_routes(payload: RouteAnalysisRequest):
    analyzer = get_route_analyzer()
    anchors = [a.dict() for a in payload.anchor_nodes]
    crimes = [c.dict() for c in payload.crime_events]
    return analyzer.analyze_awareness_space(
        offender_id=payload.offender_id,
        anchor_nodes=anchors,
        crime_events=crimes,
        buffer_radius_km=payload.buffer_radius_km
    )

@router.get("/route-analysis/{offender_id}", summary="Get Pre-configured Offender Route Profile")
def get_offender_route_profile(offender_id: str):
    # Anchor nodes for offender awareness space
    anchors = [
        {"id": "HOME", "label": "Residence (Uttam Nagar)", "lat": 28.6219, "lon": 77.0583},
        {"id": "WORK", "label": "Auto Repair Workshop (Kirti Nagar)", "lat": 28.6534, "lon": 77.1432},
        {"id": "HANGOUT", "label": "Tea Stall Hub (Karol Bagh)", "lat": 28.6514, "lon": 77.1907}
    ]
    
    # Query real crime events & sightings from PostgreSQL
    real_crimes = []
    try:
        db = SessionLocal()
        try:
            sightings = db.query(VehicleSighting).filter(VehicleSighting.latitude.isnot(None)).limit(5).all()
            for s in sightings:
                real_crimes.append({
                    "id": f"ANPR-{s.sighting_id[:8] if s.sighting_id else 'LOC'}",
                    "offense": f"Vehicle Movement at {s.location_name}",
                    "lat": s.latitude,
                    "lon": s.longitude
                })
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Error fetching real sightings for route analysis: %s", exc)

    benchmark_crimes = [
        {"id": "FIR-2026-101", "offense": "Night House Breaking", "lat": 28.6350, "lon": 77.0920},
        {"id": "FIR-2026-102", "offense": "Commercial Burglary", "lat": 28.6510, "lon": 77.1350},
        {"id": "FIR-2026-103", "offense": "Motor Vehicle Theft", "lat": 28.6520, "lon": 77.1750},
        {"id": "FIR-2026-104", "offense": "Snatching Incident", "lat": 28.6480, "lon": 77.1850},
        {"id": "FIR-2026-105", "offense": "Anomalous Distant Theft", "lat": 28.5355, "lon": 77.2600}
    ]
    crimes = real_crimes if real_crimes else benchmark_crimes

    analyzer = get_route_analyzer()
    return analyzer.analyze_awareness_space(
        offender_id=offender_id,
        anchor_nodes=anchors,
        crime_events=crimes,
        buffer_radius_km=2.5
    )
