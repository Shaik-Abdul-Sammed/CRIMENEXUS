import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.postgres import get_db
from app.models.transaction import BankTransaction
from app.models.alert import Alert
from app.models.call_record import CallRecord
from app.models.vehicle_sighting import VehicleSighting
from app.services.forensics.cdr_parser import KNOWN_TOWERS
from app.ml_service.anomaly_detector import get_anomaly_detector
from app.ml_service.forecasting_engine import get_forecasting_engine
from app.services.streaming.redis_streams import get_redis_client

logger = logging.getLogger("crimenexus.api.analytics")

router = APIRouter(prefix="/analytics", tags=["Forensic Analytics & Tripwires"])


@router.get("/smurfing", summary="Detect structuring/smurfing deposits under ₹50k to same beneficiary within 48h")
def detect_smurfing(
    db: Session = Depends(get_db),
    threshold_amount: float = Query(50000.0, description="Upper threshold for smurfing/structuring transactions"),
    min_senders: int = Query(3, description="Minimum distinct sender accounts required to flag smurfing"),
    window_hours: int = Query(48, description="Time window in hours")
) -> Dict[str, Any]:
    """
    Automated Financial Tripwire:
    Detects if 3 or more transactions under ₹50,000 were sent to the same beneficiary account
    from different sender accounts within a 48-hour window.
    If detected, automatically generates a High/Critical Priority Alert in the PostgreSQL alerts table.
    Cached for 5 minutes (300s TTL) in Redis.
    """
    cache_key = f"cache:analytics:smurfing:{threshold_amount}:{min_senders}:{window_hours}"
    r = get_redis_client()
    if r:
        try:
            cached_val = r.get(cache_key)
            if cached_val:
                return json.loads(cached_val)
        except Exception:
            pass

    # 1. Fetch candidate transactions under threshold
    sub_threshold_txs = (
        db.query(BankTransaction)
        .filter(BankTransaction.amount < threshold_amount)
        .order_by(BankTransaction.receiver_account, BankTransaction.timestamp.asc())
        .all()
    )

    # 2. Group by beneficiary account
    accounts_map: Dict[str, List[BankTransaction]] = {}
    for tx in sub_threshold_txs:
        accounts_map.setdefault(tx.receiver_account, []).append(tx)

    detected_incidents: List[Dict[str, Any]] = []
    generated_alerts: List[Dict[str, Any]] = []

    # 3. Detect sliding 48-hour smurfing clusters per beneficiary
    for beneficiary_account, tx_list in accounts_map.items():
        if len(tx_list) < min_senders:
            continue

        account_flagged = False
        for i in range(len(tx_list)):
            if account_flagged:
                break
            t_start = tx_list[i]
            t_end_limit = t_start.timestamp + timedelta(hours=window_hours)

            # Find all transactions within the 48-hour window starting from t_start
            cluster = [t for t in tx_list if t_start.timestamp <= t.timestamp <= t_end_limit]
            distinct_senders = {t.sender_account: t.sender_name for t in cluster}

            if len(distinct_senders) >= min_senders:
                account_flagged = True
                total_amount = sum(t.amount for t in cluster)
                receiver_name = cluster[0].receiver_name

                # Step 2: ML Isolation Forest Anomaly Detection
                detector = get_anomaly_detector()
                cluster_tx_dicts = [
                    {
                        "sender_account": t.sender_account,
                        "amount": t.amount,
                        "timestamp": t.timestamp.isoformat()
                    }
                    for t in cluster
                ]
                ml_eval = detector.evaluate_account_transactions(beneficiary_account, cluster_tx_dicts)
                anomaly_score = ml_eval.get("anomaly_score", 0.95)
                is_high_priority = ml_eval.get("high_priority_alert", True)

                incident = {
                    "beneficiary_account": beneficiary_account,
                    "receiver_name": receiver_name,
                    "transaction_count": len(cluster),
                    "distinct_senders_count": len(distinct_senders),
                    "senders": list(distinct_senders.keys()),
                    "total_amount": total_amount,
                    "anomaly_score": anomaly_score,
                    "is_ml_outlier": ml_eval.get("is_outlier", True),
                    "high_priority_alert": is_high_priority,
                    "ml_model": ml_eval.get("feature_metrics", {}).get("model_version", "isolation-forest-1.0"),
                    "window_start": t_start.timestamp.isoformat(),
                    "window_end": max(t.timestamp for t in cluster).isoformat(),
                    "transactions": [
                        {
                            "id": t.transaction_id,
                            "sender_name": t.sender_name,
                            "sender_account": t.sender_account,
                            "amount": t.amount,
                            "timestamp": t.timestamp.isoformat()
                        }
                        for t in cluster
                    ]
                }
                detected_incidents.append(incident)

                # 4. Automatic Insertion of High/Critical Priority Alert into PostgreSQL
                alert_title = f"Action Required: Freeze Account {beneficiary_account} due to Smurfing"
                existing_alert = (
                    db.query(Alert)
                    .filter(
                        Alert.alert_type == "FINANCIAL_TRIPWIRE",
                        Alert.title == alert_title,
                        Alert.status == "new"
                    )
                    .first()
                )

                if not existing_alert:
                    new_alert = Alert(
                        alert_type="FINANCIAL_TRIPWIRE",
                        title=alert_title,
                        description=(
                            f"Financial Tripwire: Detected {len(cluster)} structured deposits totaling ₹{total_amount:,.2f} "
                            f"under ₹{threshold_amount:,.0f} from {len(distinct_senders)} distinct sender accounts "
                            f"within {window_hours} hours into beneficiary account {beneficiary_account} ({receiver_name}). "
                            f"ML Anomaly Score: {anomaly_score:.2f} (Isolation Forest). "
                            f"Directive: Issue emergency account freeze order under Section 102 CrPC / PMLA 2002."
                        ),
                        severity="high" if is_high_priority else "medium",
                        threat_score=round(anomaly_score, 2),
                        status="new",
                        created_at=datetime.utcnow()
                    )
                    db.add(new_alert)
                    db.commit()
                    db.refresh(new_alert)
                    generated_alerts.append({
                        "alert_id": new_alert.id,
                        "title": new_alert.title,
                        "severity": new_alert.severity,
                        "threat_score": new_alert.threat_score,
                        "status": new_alert.status,
                        "created_at": new_alert.created_at.isoformat()
                    })
                else:
                    generated_alerts.append({
                        "alert_id": existing_alert.id,
                        "title": existing_alert.title,
                        "severity": existing_alert.severity,
                        "threat_score": existing_alert.threat_score,
                        "status": "EXISTING_NEW",
                        "created_at": existing_alert.created_at.isoformat()
                    })

    result_payload = {
        "status": "success",
        "tripwire": "SMURFING_STRUCTURING_DETECTION",
        "incidents_detected": len(detected_incidents),
        "incidents": detected_incidents,
        "alerts": generated_alerts
    }
    if r:
        try:
            r.setex(cache_key, 300, json.dumps(result_payload))
        except Exception:
            pass
    return result_payload


@router.get("/alerts", summary="Get active system and tripwire alerts")
def get_alerts(
    db: Session = Depends(get_db),
    alert_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
) -> List[Dict[str, Any]]:
    """Retrieves all system alerts from PostgreSQL."""
    query = db.query(Alert)
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
    if status:
        query = query.filter(Alert.status == status)

    alerts = query.order_by(Alert.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "title": a.title,
            "description": a.description,
            "severity": a.severity,
            "threat_score": a.threat_score,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in alerts
    ]


@router.get("/movement-timeline", summary="Correlated movement timeline (CDR pings + ANPR vehicle sightings)")
def get_movement_timeline(
    db: Session = Depends(get_db),
    plate_number: Optional[str] = Query("TS 09 AB 1234"),
    phone_number: Optional[str] = Query("+91 98765 43210")
) -> Dict[str, Any]:
    """
    Correlates telecom cell tower pings (CDR) with automated number plate recognition (ANPR)
    camera sightings into a unified chronological GeoJSON LineString and coordinate timeline.
    """
    events = []

    # 1. Fetch ANPR Sightings
    vehicle_query = db.query(VehicleSighting)
    if plate_number:
        clean_plate = plate_number.replace(" ", "").upper()
        # Search by exact plate or sanitized plate
        vehicle_query = vehicle_query.filter(
            (VehicleSighting.plate_number == plate_number) |
            (func.replace(VehicleSighting.plate_number, ' ', '') == clean_plate)
        )
    sightings = vehicle_query.order_by(VehicleSighting.timestamp.asc()).all()

    for vs in sightings:
        events.append({
            "type": "ANPR_SIGHTING",
            "timestamp": vs.timestamp.isoformat() if vs.timestamp else datetime.utcnow().isoformat(),
            "datetime": vs.timestamp,
            "latitude": vs.latitude or 28.1402,
            "longitude": vs.longitude or 77.5510,
            "title": f"ANPR: {vs.plate_number} sighted at {vs.location_name}",
            "location_name": vs.location_name,
            "entity": vs.plate_number,
            "details": f"Camera {vs.camera_id} recorded {vs.vehicle_model or 'Vehicle'} at {vs.speed_kmh or 0} km/h (Confidence: {vs.confidence or 0.95})"
        })

    # 2. Fetch CDR Phone Records
    cdr_query = db.query(CallRecord)
    if phone_number:
        cdr_query = cdr_query.filter(
            (CallRecord.caller_number == phone_number) |
            (CallRecord.receiver_number == phone_number)
        )
    calls = cdr_query.order_by(CallRecord.timestamp.asc()).all()

    for call in calls:
        tower_id = call.tower_id or "TOWER-NOIDA-62"
        tower_info = KNOWN_TOWERS.get(tower_id, {"lat": 28.6280, "lon": 77.3649, "sector": call.location_name or "Sector 62 Tech Zone, Noida"})
        events.append({
            "type": "CDR_CELL_PING",
            "timestamp": call.timestamp.isoformat() if call.timestamp else datetime.utcnow().isoformat(),
            "datetime": call.timestamp,
            "latitude": tower_info["lat"],
            "longitude": tower_info["lon"],
            "title": f"Cell Tower Ping: {tower_id} ({tower_info['sector']})",
            "location_name": tower_info["sector"],
            "entity": call.caller_number,
            "details": f"Call to {call.receiver_number} (Duration: {call.duration_seconds}s, Type: {call.call_type})"
        })

    # Sort unified events chronologically
    events.sort(key=lambda x: x.get("datetime") or datetime.min)

    # 3. Construct GeoJSON LineString & Point Features
    features = []
    coordinates = []

    for idx, ev in enumerate(events):
        lng = float(ev["longitude"])
        lat = float(ev["latitude"])
        coordinates.append([lng, lat])

        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat]
            },
            "properties": {
                "sequence": idx + 1,
                "eventType": ev["type"],
                "timestamp": ev["timestamp"],
                "title": ev["title"],
                "locationName": ev["location_name"],
                "entity": ev["entity"],
                "details": ev["details"]
            }
        })

    if len(coordinates) >= 2:
        features.insert(0, {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            },
            "properties": {
                "name": "Suspect Transit Path",
                "total_points": len(coordinates)
            }
        })

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    # Remove temporary datetime object for JSON serialization
    for ev in events:
        ev.pop("datetime", None)

    return {
        "status": "success",
        "target_plate": plate_number,
        "target_phone": phone_number,
        "total_waypoint_count": len(events),
        "geojson": geojson,
        "timeline_events": events
    }


@router.get("/forecast", summary="Predictive 7-Day Spatio-Temporal Crime Forecasting")
def get_crime_forecast():
    """
    Returns time-series forecasted crime incident counts, spike probabilities,
    and patrol zone hotspot recommendations for the next 7 days by district.
    """
    engine = get_forecasting_engine()
    return engine.forecast_7_days()
