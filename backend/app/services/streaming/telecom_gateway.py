"""
Real-Time CDR Streaming Fusion & Telecom Gateway for CRIMENEXUS.

Simulates lawful interception live packet ingestion from Telecom Service Providers
(Airtel, Jio, Vi, BSNL) over Redis Streams / TCP Gateway.
Enables real-time cell tower handover tracking, co-accused ping detection,
and active target geofence interception.
"""

import math
import datetime
from typing import Dict, Any, List
from collections import deque

# In-memory watch targets and live packet ring buffer (capacity 10,000 packets)
_LIVE_STREAM_BUFFER: deque = deque(maxlen=10000)
_TARGET_WATCHLIST: Dict[str, Dict[str, Any]] = {}


def register_target_watch(phone: str, case_id: str, priority: str = "CRITICAL"):
    """
    Registers a phone number on the active lawful interception watchlist.
    """
    cleaned = phone.strip().replace(" ", "").replace("-", "")
    _TARGET_WATCHLIST[cleaned] = {
        "phone": cleaned,
        "case_id": case_id,
        "priority": priority,
        "registered_at": datetime.datetime.utcnow().isoformat()
    }


def clear_telecom_gateway_for_tests():
    _LIVE_STREAM_BUFFER.clear()
    _TARGET_WATCHLIST.clear()


def _is_point_in_radius(lat1: float, lon1: float, lat2: float, lon2: float, radius_km: float) -> bool:
    """
    Haversine distance check between event coordinate and geofence center.
    """
    r = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    dist = r * c
    return dist <= radius_km


def ingest_live_cdr_packet(packet: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ingests and validates a live telecom event packet from TSP gateway.
    Checks against watchlist and geofence alerts.
    """
    caller = packet.get("caller", "").strip().replace(" ", "").replace("-", "")
    callee = packet.get("callee", "").strip().replace(" ", "").replace("-", "")
    ts = packet.get("timestamp") or datetime.datetime.utcnow().isoformat()
    lat = float(packet.get("latitude", 0.0))
    lon = float(packet.get("longitude", 0.0))
    tower_id = packet.get("tower_id", "CELL-UNKNOWN")

    record = {
        "caller": caller,
        "callee": callee,
        "call_type": packet.get("call_type", "VOICE"),
        "tower_id": tower_id,
        "latitude": lat,
        "longitude": lon,
        "duration_sec": int(packet.get("duration_sec", 0)),
        "timestamp": ts,
        "carrier": packet.get("carrier", "TELECOM_INDIA")
    }

    _LIVE_STREAM_BUFFER.append(record)

    # Check target match
    is_target_hit = False
    hit_case_id = None
    if caller in _TARGET_WATCHLIST:
        is_target_hit = True
        hit_case_id = _TARGET_WATCHLIST[caller]["case_id"]
    elif callee in _TARGET_WATCHLIST:
        is_target_hit = True
        hit_case_id = _TARGET_WATCHLIST[callee]["case_id"]

    # Check geofence
    geofence = packet.get("active_geofence")
    in_geofence = False
    if geofence and lat != 0.0 and lon != 0.0:
        center_lat = float(geofence.get("center_lat", 0.0))
        center_lon = float(geofence.get("center_lon", 0.0))
        radius = float(geofence.get("radius_km", 2.0))
        in_geofence = _is_point_in_radius(lat, lon, center_lat, center_lon, radius)

    alert = None
    if is_target_hit or in_geofence:
        alert = {
            "alert_type": "REALTIME_INTERCEPT_TRIGGER",
            "case_id": hit_case_id or "GEOFENCE_INCIDENT",
            "caller": caller,
            "callee": callee,
            "tower_id": tower_id,
            "in_geofence": in_geofence,
            "priority": "CRITICAL" if is_target_hit else "HIGH",
            "alert_time": datetime.datetime.utcnow().isoformat(),
            "dispatch_instruction": f"Immediate tactical triangulation requested at tower {tower_id} ({lat}, {lon})."
        }

    return {
        "status": "INGESTED",
        "tower_id": tower_id,
        "is_target_hit": is_target_hit,
        "in_geofence": in_geofence,
        "alert": alert
    }


def get_live_cdr_trail(phone: str) -> List[Dict[str, Any]]:
    """
    Returns sequential tower handovers and call history for an active phone number.
    """
    target = phone.strip().replace(" ", "").replace("-", "")
    trail = [
        rec for rec in _LIVE_STREAM_BUFFER
        if rec["caller"] == target or rec["callee"] == target
    ]
    # Sort chronologically
    return sorted(trail, key=lambda x: x["timestamp"])
