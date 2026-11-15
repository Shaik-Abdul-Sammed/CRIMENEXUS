import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel, Field

logger = logging.getLogger("crimenexus.rtcc")

router = APIRouter(tags=["Real-Time Crime Center (RTCC)"])

class RTCCDispatch(BaseModel):
    incident_id: str
    unit_id: str
    priority: str = "HIGH"
    location: str
    instructions: str

# Sample stream buffers for the 4 command panels
SAMPLE_ALERTS = [
    {"id": "ALT-901", "type": "WEAPON_DETECTED", "location": "Connaught Place Block B", "time": "Just now", "severity": "CRITICAL", "confidence": 0.94},
    {"id": "ALT-902", "type": "PANIC_BUTTON", "location": "Nizamuddin Railway Station Outer", "time": "2m ago", "severity": "HIGH", "confidence": 0.99},
    {"id": "ALT-903", "type": "UNATTENDED_BAGGAGE", "location": "Kashmere Gate Metro ISBT", "time": "5m ago", "severity": "MEDIUM", "confidence": 0.88}
]

SAMPLE_ANPR = [
    {"id": "ANPR-881", "plate": "DL-1CAB-9012", "vehicle": "White Hyundai Creta", "location": "Dhaula Kuan Junction Northbound", "flag": "STOLEN_IN_FIR_882", "speed": "68 km/h", "timestamp": "12s ago"},
    {"id": "ANPR-882", "plate": "HR-26-DQ-4410", "vehicle": "Black Scorpio S11", "location": "Cyber City Exit NH-48", "flag": "INTERPOL_WATCHLIST", "speed": "74 km/h", "timestamp": "45s ago"},
    {"id": "ANPR-883", "plate": "UP-16-AZ-1109", "vehicle": "Silver Swift Dzire", "location": "Chilla Border Toll Plaza", "flag": "SUSPECT_INTERCEPTION", "speed": "32 km/h", "timestamp": "2m ago"}
]

SAMPLE_CDR = [
    {"id": "CDR-501", "imei": "864920048123490", "target": "Target Echo-4 (Syndicate Courier)", "tower_id": "TOW-DEL-CP-04", "lat": 28.6315, "lon": 77.2167, "cell_azimuth": "120 deg", "timestamp": "5s ago"},
    {"id": "CDR-502", "imei": "359182057194021", "target": "Suspect Beta (Safehouse Scout)", "tower_id": "TOW-DEL-NZM-02", "lat": 28.5889, "lon": 77.2534, "cell_azimuth": "240 deg", "timestamp": "28s ago"},
    {"id": "CDR-503", "imei": "860491048821934", "target": "Burner Handset #9", "tower_id": "TOW-DEL-KSH-01", "lat": 28.6675, "lon": 77.2285, "cell_azimuth": "045 deg", "timestamp": "1m ago"}
]

SAMPLE_MARKERS = [
    {"id": "GEO-1", "title": "Stolen Creta Moving", "lat": 28.5921, "lon": 77.1583, "type": "VEHICLE", "status": "PURSUIT_ACTIVE"},
    {"id": "GEO-2", "title": "Critical Weapon Sighting", "lat": 28.6328, "lon": 77.2197, "type": "ALERT", "status": "CONTAINMENT"},
    {"id": "GEO-3", "title": "Burner IMEI Triangulation", "lat": 28.6675, "lon": 77.2285, "type": "CDR", "status": "SURVEILLANCE"}
]

@router.get("/rtcc/health", summary="RTCC Health Check")
def rtcc_health():
    return {
        "status": "healthy",
        "service": "Real-Time Crime Center (RTCC)",
        "streams": ["LIVE_ALERTS", "ANPR_HOTLIST", "CDR_PINGS", "GEO_TELEMETRY"],
        "active_units_online": 48,
        "version": "1.0.0"
    }

@router.get("/rtcc/cameras", summary="Get Active RTCC Tactical CCTV Camera Feeds")
def rtcc_cameras():
    return [
        {"camera_id": "CAM-DEL-CP-01", "name": "Connaught Place Inner Circle", "lat": 28.6315, "lon": 77.2167, "status": "LIVE", "ptz": True},
        {"camera_id": "CAM-DEL-ISBT-02", "name": "Kashmere Gate ISBT Entry Gate", "lat": 28.6675, "lon": 77.2285, "status": "LIVE", "ptz": False},
        {"camera_id": "CAM-DEL-NZM-03", "name": "Hazrat Nizamuddin Terminal", "lat": 28.5889, "lon": 77.2534, "status": "LIVE", "ptz": True},
    ]

@router.get("/rtcc/events", summary="Get Latest RTCC Multi-Panel Feed Snapshot")
def rtcc_events_snapshot():
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "alerts": SAMPLE_ALERTS,
        "anpr": SAMPLE_ANPR,
        "cdr": SAMPLE_CDR,
        "markers": SAMPLE_MARKERS
    }

@router.post("/rtcc/dispatch", summary="Dispatch Tactical Unit from RTCC")
def rtcc_dispatch(payload: RTCCDispatch):
    return {
        "status": "DISPATCHED",
        "incident_id": payload.incident_id,
        "unit_id": payload.unit_id,
        "priority": payload.priority,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "acknowledgement": f"PCR Van {payload.unit_id} tasked to {payload.location}."
    }

@router.websocket("/ws/rtcc")
@router.websocket("/api/v1/rtcc/ws")
async def rtcc_websocket(websocket: WebSocket):
    """
    WebSocket endpoint streaming live multi-source intelligence events
    to the 4-panel RTCC command screen.
    """
    await websocket.accept()
    logger.info("RTCC client connected via WebSocket.")
    try:
        # Send initial snapshot
        await websocket.send_text(json.dumps({
            "type": "INITIAL_SNAPSHOT",
            "data": rtcc_events_snapshot()
        }))
        
        step = 0
        while True:
            await asyncio.sleep(3.0)
            step += 1
            # Push periodic live simulated telemetry
            sim_event = {
                "type": "TELEMETRY_UPDATE",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": {
                    "source": "ANPR" if step % 2 == 0 else "CDR",
                    "data": SAMPLE_ANPR[step % len(SAMPLE_ANPR)] if step % 2 == 0 else SAMPLE_CDR[step % len(SAMPLE_CDR)]
                }
            }
            await websocket.send_text(json.dumps(sim_event))
    except WebSocketDisconnect:
        logger.info("RTCC client disconnected from WebSocket.")
    except Exception as e:
        logger.warning("RTCC WebSocket error: %s", e)
