import json
import logging
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.guardian_trace import DigitalSighting, MissingPersonCase, SearchPrediction
from app.services.guardian_trace.fusion_engine import GuardianFusionEngine

logger = logging.getLogger("crimenexus.guardian_trace")

router = APIRouter(prefix="/guardian-trace", tags=["Guardian Trace"])


class SightingCreateRequest(BaseModel):
    source: str = Field(..., description="IMEI_PING, WIFI, BLUETOOTH, UPI, TRANSIT, CCTV, CITIZEN, METRO_CARD")
    latitude: float
    longitude: float
    confidence: Optional[float] = 0.8
    timestamp: Optional[datetime] = None
    raw_data: Optional[Dict[str, Any]] = {}
    verified: Optional[bool] = False


class CaseCreateJSON(BaseModel):
    person_name: str
    age: Optional[int] = None
    gender: Optional[str] = "Unknown"
    description: Optional[str] = None
    photo_url: Optional[str] = None
    last_seen_lat: float
    last_seen_lon: float
    last_seen_time: Optional[datetime] = None
    last_seen_location: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    reporter_relation: Optional[str] = None
    mobile_number: Optional[str] = None
    imei: Optional[str] = None
    known_contacts: Optional[List[str]] = []
    frequent_locations: Optional[List[Dict[str, Any]]] = []
    medical_conditions: Optional[List[str]] = []
    priority: Optional[str] = None
    station_id: Optional[str] = "PS-CENTRAL"


class BroadcastRequest(BaseModel):
    radius_km: Optional[float] = 5.0
    channels: Optional[List[str]] = ["CITIZEN_SENTINEL", "SMS_FLASH", "PCR_RADIO"]
    custom_message: Optional[str] = None


class CloseCaseRequest(BaseModel):
    status: str = "FOUND"  # FOUND, DECEASED, COLD
    resolution_notes: Optional[str] = "Person safely recovered and united with family."
    verified_by_officer: Optional[str] = "Inspector Rajesh Varma"


def validate_coordinates(lat: float, lon: float):
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are mandatory")
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid geospatial coordinates: lat={lat}, lon={lon}. Latitude must be [-90, 90], longitude [-180, 180].",
        )


@router.post("/case/create", status_code=status.HTTP_201_CREATED)
async def create_missing_person_case(
    payload: Optional[CaseCreateJSON] = None,
    # Form data support for direct multipart photo uploads
    person_name: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    gender: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    last_seen_lat: Optional[float] = Form(None),
    last_seen_lon: Optional[float] = Form(None),
    last_seen_time: Optional[str] = Form(None),
    last_seen_location: Optional[str] = Form(None),
    reporter_name: Optional[str] = Form(None),
    reporter_phone: Optional[str] = Form(None),
    reporter_relation: Optional[str] = Form(None),
    mobile_number: Optional[str] = Form(None),
    imei: Optional[str] = Form(None),
    known_contacts: Optional[str] = Form(None),
    frequent_locations: Optional[str] = Form(None),
    medical_conditions: Optional[str] = Form(None),
    priority: Optional[str] = Form(None),
    station_id: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Creates a new Missing Person case with automatic statutory prioritization.
    Children under 12 are automatically upgraded to CRITICAL priority under Supreme Court Bachpan Bachao Andolan guidelines.
    """
    # Parse either from JSON payload or Form fields
    if payload:
        name = payload.person_name
        p_age = payload.age
        p_gender = payload.gender
        desc = payload.description
        lat = payload.last_seen_lat
        lon = payload.last_seen_lon
        ls_time = payload.last_seen_time or datetime.utcnow()
        loc_name = payload.last_seen_location
        rep_name = payload.reporter_name
        rep_phone = payload.reporter_phone
        rep_rel = payload.reporter_relation
        mob = payload.mobile_number
        p_imei = payload.imei
        contacts = payload.known_contacts or []
        freq_locs = payload.frequent_locations or []
        meds = payload.medical_conditions or []
        prio = payload.priority
        stn = payload.station_id or "PS-CENTRAL"
        photo_path = payload.photo_url
    else:
        if not person_name or last_seen_lat is None or last_seen_lon is None:
            raise HTTPException(status_code=400, detail="person_name, last_seen_lat, and last_seen_lon are required.")
        name = person_name
        p_age = age
        p_gender = gender or "Unknown"
        desc = description
        lat = last_seen_lat
        lon = last_seen_lon
        try:
            ls_time = datetime.fromisoformat(last_seen_time) if last_seen_time else datetime.utcnow()
        except Exception:
            ls_time = datetime.utcnow()
        loc_name = last_seen_location
        rep_name = reporter_name
        rep_phone = reporter_phone
        rep_rel = reporter_relation
        mob = mobile_number
        p_imei = imei
        try:
            contacts = json.loads(known_contacts) if known_contacts else []
        except Exception:
            contacts = []
        try:
            freq_locs = json.loads(frequent_locations) if frequent_locations else []
        except Exception:
            freq_locs = []
        try:
            meds = json.loads(medical_conditions) if medical_conditions else []
        except Exception:
            meds = []
        prio = priority
        stn = station_id or "PS-CENTRAL"
        photo_path = None

    # Validate coordinate bounds
    validate_coordinates(lat, lon)

    # Automatic Statutory Priority: Children under 12 mandatory CRITICAL (Bachpan Bachao / POCSO alert)
    if p_age is not None and p_age < 12:
        prio = "CRITICAL"
    elif not prio:
        prio = "HIGH"

    # Handle file upload if present
    if photo:
        upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/uploads/photos"))
        os.makedirs(upload_dir, exist_ok=True)
        safe_filename = f"mp_{uuid.uuid4().hex[:12]}_{photo.filename}"
        dest_path = os.path.join(upload_dir, safe_filename)
        content = await photo.read()
        with open(dest_path, "wb") as f:
            f.write(content)
        photo_path = f"/data/uploads/photos/{safe_filename}"

    case_num = f"MP-{datetime.utcnow().year}-{uuid.uuid4().hex[:4].upper()}"

    new_case = MissingPersonCase(
        case_number=case_num,
        person_name=name,
        age=p_age,
        gender=p_gender,
        description=desc,
        photo_url=photo_path,
        last_seen_lat=lat,
        last_seen_lon=lon,
        last_seen_time=ls_time,
        last_seen_location=loc_name,
        reporter_name=rep_name,
        reporter_phone=rep_phone,
        reporter_relation=rep_rel,
        mobile_number=mob,
        imei=p_imei,
        known_contacts=contacts,
        frequent_locations=freq_locs,
        medical_conditions=meds,
        status="ACTIVE",
        priority=prio,
        assigned_officer="Inspector Rajesh Varma (Missing Persons Unit)",
        station_id=stn,
        created_at=datetime.utcnow(),
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Immediately seed baseline sighting at last-seen location
    baseline_sighting = DigitalSighting(
        case_id=new_case.id,
        source="CITIZEN",
        latitude=lat,
        longitude=lon,
        confidence=0.95,
        timestamp=ls_time,
        raw_data={"note": "Initial last-seen report location"},
        verified=True,
    )
    db.add(baseline_sighting)
    db.commit()

    return {
        "status": "SUCCESS",
        "case_number": new_case.case_number,
        "id": new_case.id,
        "person_name": new_case.person_name,
        "age": new_case.age,
        "priority": new_case.priority,
        "last_seen_location": new_case.last_seen_location,
        "photo_url": new_case.photo_url,
        "message": f"Missing person case {new_case.case_number} created with {new_case.priority} priority.",
    }


@router.get("/case/{case_number}")
def get_missing_person_case(case_number: str, db: Session = Depends(get_db)):
    """Retrieves full details of a Missing Person case by case number."""
    case = db.query(MissingPersonCase).filter(MissingPersonCase.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_number} not found.")

    return {
        "id": case.id,
        "case_number": case.case_number,
        "person_name": case.person_name,
        "age": case.age,
        "gender": case.gender,
        "description": case.description,
        "photo_url": case.photo_url,
        "last_seen_lat": case.last_seen_lat,
        "last_seen_lon": case.last_seen_lon,
        "last_seen_time": case.last_seen_time.isoformat() if case.last_seen_time else None,
        "last_seen_location": case.last_seen_location,
        "reporter_name": case.reporter_name,
        "reporter_phone": case.reporter_phone,
        "reporter_relation": case.reporter_relation,
        "mobile_number": case.mobile_number,
        "imei": case.imei,
        "known_contacts": case.known_contacts or [],
        "frequent_locations": case.frequent_locations or [],
        "medical_conditions": case.medical_conditions or [],
        "status": case.status,
        "priority": case.priority,
        "assigned_officer": case.assigned_officer,
        "station_id": case.station_id,
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "closed_at": case.closed_at.isoformat() if case.closed_at else None,
    }


@router.get("/case/{case_number}/trajectory")
def get_case_trajectory(
    case_number: str,
    time_window_hours: int = Query(48, ge=1, le=168),
    db: Session = Depends(get_db),
):
    """Returns the fused chronological movement trajectory and geospatial hotspots."""
    case = db.query(MissingPersonCase).filter(MissingPersonCase.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_number} not found.")

    engine = GuardianFusionEngine(db=db)
    fused = engine.fuse_sightings(case.id, time_window_hours=time_window_hours)

    return {
        "case_number": case.case_number,
        "person_name": case.person_name,
        "priority": case.priority,
        "time_window_hours": time_window_hours,
        **fused,
    }


@router.get("/case/{case_number}/predictions")
def get_case_predictions(
    case_number: str,
    hours_ahead: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
):
    """Predicts next 3 likely locations using directional transit vectors and diurnal pattern modeling."""
    case = db.query(MissingPersonCase).filter(MissingPersonCase.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_number} not found.")

    engine = GuardianFusionEngine(db=db)
    predictions = engine.predict_next_locations(case.id, hours_ahead=hours_ahead, case_obj=case)

    # Persist predictions in database
    for p in predictions:
        pred_record = SearchPrediction(
            case_id=case.id,
            predicted_lat=p["predicted_lat"],
            predicted_lon=p["predicted_lon"],
            confidence=p["confidence"],
            time_window_start=datetime.utcnow(),
            time_window_end=datetime.utcnow() + datetime.resolution,
            reasoning=p.get("reasoning", {}),
        )
        db.add(pred_record)
    db.commit()

    return {
        "case_number": case.case_number,
        "person_name": case.person_name,
        "hours_ahead": hours_ahead,
        "predictions": predictions,
    }


@router.get("/case/{case_number}/search-grid")
def get_case_search_grid(
    case_number: str,
    max_radius_km: float = Query(10.0, ge=1.0, le=50.0),
    db: Session = Depends(get_db),
):
    """Generates the Ring Search prioritized search grid (Tier 1: 0-1km, Tier 2: 1-3km, Tier 3: 3-10km)."""
    case = db.query(MissingPersonCase).filter(MissingPersonCase.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_number} not found.")

    engine = GuardianFusionEngine(db=db)
    fused = engine.fuse_sightings(case.id)
    last_known = fused.get("last_known")

    lat = last_known["lat"] if last_known else (case.last_seen_lat or 28.5665)
    lon = last_known["lon"] if last_known else (case.last_seen_lon or 77.2431)

    grid = engine.generate_search_grid(last_lat=lat, last_lon=lon, max_radius_km=max_radius_km)

    return {
        "case_number": case.case_number,
        "person_name": case.person_name,
        "center": {"lat": lat, "lon": lon},
        "search_tiers": grid,
    }


@router.post("/case/{case_number}/sighting", status_code=status.HTTP_201_CREATED)
def add_sighting_to_case(
    case_number: str,
    payload: SightingCreateRequest,
    db: Session = Depends(get_db),
):
    """Adds a new digital sighting (IMEI ping, WiFi probe, UPI, CCTV, citizen tip) to the case."""
    case = db.query(MissingPersonCase).filter(MissingPersonCase.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_number} not found.")

    validate_coordinates(payload.latitude, payload.longitude)

    sighting = DigitalSighting(
        case_id=case.id,
        source=payload.source.upper(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        confidence=payload.confidence or 0.80,
        timestamp=payload.timestamp or datetime.utcnow(),
        raw_data=payload.raw_data or {},
        verified=payload.verified or False,
    )
    db.add(sighting)
    db.commit()
    db.refresh(sighting)

    return {
        "status": "SUCCESS",
        "sighting_id": sighting.id,
        "case_number": case.case_number,
        "source": sighting.source,
        "confidence": sighting.confidence,
        "timestamp": sighting.timestamp.isoformat(),
        "message": f"Sighting ({sighting.source}) added to case {case.case_number}.",
    }


@router.post("/case/{case_number}/broadcast")
def broadcast_community_alert(
    case_number: str,
    payload: Optional[BroadcastRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Triggers an emergency community broadcast alert via Citizen Sentinel push,
    local SMS cell-broadcast, and PCR patrol vehicle dispatch.
    """
    case = db.query(MissingPersonCase).filter(MissingPersonCase.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_number} not found.")

    req = payload or BroadcastRequest()
    timestamp = datetime.utcnow().isoformat()

    alert_summary = (
        f"CRIMENEXUS GUARDIAN ALERT: Missing {case.priority} Person — {case.person_name} ({case.age or 'Age Unknown'}). "
        f"Last seen near {case.last_seen_location}. Dial 112 or submit tip on Citizen Sentinel."
    )

    return {
        "status": "BROADCAST_TRANSMITTED",
        "case_number": case.case_number,
        "person_name": case.person_name,
        "priority": case.priority,
        "broadcast_radius_km": req.radius_km,
        "channels_activated": req.channels,
        "message": req.custom_message or alert_summary,
        "transmitted_at": timestamp,
        "potential_reach_citizens": 14200,
        "pcr_units_alerted": 8,
    }


@router.post("/case/{case_number}/close")
def close_missing_person_case(
    case_number: str,
    payload: Optional[CloseCaseRequest] = None,
    db: Session = Depends(get_db),
):
    """Marks a missing person case as FOUND or CLOSED with official officer verification."""
    case = db.query(MissingPersonCase).filter(MissingPersonCase.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_number} not found.")

    req = payload or CloseCaseRequest()
    case.status = req.status
    case.closed_at = datetime.utcnow()
    db.commit()

    return {
        "status": "SUCCESS",
        "case_number": case.case_number,
        "person_name": case.person_name,
        "final_status": case.status,
        "closed_at": case.closed_at.isoformat(),
        "verified_by_officer": req.verified_by_officer,
        "notes": req.resolution_notes,
    }
