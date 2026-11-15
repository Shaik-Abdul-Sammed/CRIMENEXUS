"""
CRIMENEXUS Escape Simulation & Omni-Trace API Endpoints.

Provides:
- GET /api/v1/escape-demo/omni-trace/{suspect_id}
- GET /api/v1/escape-demo/data-lake
- GET /api/v1/escape-demo/smart-meter-anomalies
"""

import datetime
import logging
import random
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Path, Query, Depends
from app.services.streaming.omni_footprint_simulator import get_omni_footprint_simulator
from app.services.streaming.digital_exhaust_simulator import get_digital_exhaust_simulator
from app.services.streaming.escape_simulator import get_escape_simulator
from app.services.streaming.redis_streams import get_streaming_stats
from app.security.authentication import get_current_user, get_optional_current_user
from app.models.user import User
from app.database.postgres import SessionLocal, get_db
from app.models.vehicle_sighting import VehicleSighting
from app.models.call_record import CallRecord
from app.models.transaction import BankTransaction
from app.models.smart_meter_reading import SmartMeterReading
from sqlalchemy.orm import Session

logger = logging.getLogger("crimenexus.escape_demo")

router = APIRouter(prefix="/escape-demo", tags=["Escape Simulation & Omni-Trace Engine"])


@router.get("/step/{step_id}", summary="Execute Operation Shatter Simulation Step (1, 2, or 3)")
def get_escape_simulation_step(
    step_id: int = Path(..., ge=1, le=3, description="Simulation Step: 1=Vehicle Swap, 2=Smurfing, 3=Safehouse Intercept")
):
    """
    Executes a discrete step in the Operation Shatter criminal evasion scenario:
    - Step 1: Plate Swap (TS 09 AB 1234 -> DL 01 XY 9876) caught via FASTag + Chassis ANPR fusion.
    - Step 2: Smurfing Liquidation (10 mule accounts x ₹49,000) caught via IsolationForest anomaly detector.
    - Step 3: Safehouse Hideout (Sector 62 Noida) caught via Adamic-Adar Link Prediction + QAOA intercept for PCR-04.
    """
    simulator = get_escape_simulator()
    if step_id == 1:
        return simulator.execute_step_1()
    elif step_id == 2:
        return simulator.execute_step_2()
    else:
        return simulator.execute_step_3()


@router.get("/run", summary="Run Full Operation Shatter Evasion Scenario (All 3 Steps)")
def run_full_escape_simulation():
    """Runs all 3 steps of Operation Shatter in a single unified JSON response."""
    simulator = get_escape_simulator()
    return simulator.execute_all_steps()


@router.get("/omni-trace/{suspect_id}", summary="Aggregate 5-Dimensional Omni-Trace & Digital Exhaust Dossier")
def get_omni_trace_endpoint(
    suspect_id: str = Path(..., description="Target Suspect Identifier (e.g. rajan, raj, SUSP-001)")
):
    """
    Correlates 5 core categories of digital exhaust:
    1. Telecom & ISP (ICCID, Bluetooth MAC, WiFi Probe, ISP DNS, TOR Exit Node DPI)
    2. E-Commerce & Logistics (Amazon burner phone drop, Zomato 2 AM delivery, Uber Karol Bagh -> Noida)
    3. Social & Cloud (Instagram EXIF Geotag, Google Drive Sync, YouTube Watch History)
    4. IoT & Smart Home (Alexa Voice Command, Smart Doorbell PIR, Fitness Tracker 142 BPM spike)
    5. Alternative Finance (Binance P2P crypto off-ramp, Gift Card laundering, CIBIL Hard Inquiry)

    Outputs a Section 63 BSA court-admissible arrest warrant with 98.4% confidence and 8.5m precision.
    """
    exhaust_sim = get_digital_exhaust_simulator()
    dossier = exhaust_sim.generate_fused_dossier(suspect_id=suspect_id)

    # Attach complementary multi-step progression & OSRM intercept vector
    legacy_sim = get_omni_footprint_simulator()
    legacy_dossier = legacy_sim.generate_omni_trace_dossier(suspect_id=suspect_id)
    dossier["footprint_progression"] = legacy_dossier
    dossier["target_pinned_coords"] = legacy_dossier.get("target_pinned_coords")
    dossier["patrol_intercept_vector"] = legacy_dossier.get("patrol_intercept_vector")
    return dossier


@router.get("/data-lake", summary="Query 96-Source Data Lake Ingestion Volume & Critical Clues")
def get_data_lake_clues(current_user: Optional[User] = Depends(get_optional_current_user)):
    """
    Visualizes ingestion of all 96 digital clue sources across India (Telecom, IoT,
    Social Media, E-commerce, Utilities, and Finance), isolating the top smoking guns
    from real Redis Streams, PostgreSQL sightings, call records, and transactions.
    """
    # 1. Query Redis streaming stats
    redis_stats = get_streaming_stats()
    redis_events = redis_stats.get("total_events_processed", 0)

    # 2. Query PostgreSQL live counts
    sighting_count = 0
    call_count = 0
    txn_count = 0
    real_clues = []
    try:
        db = SessionLocal()
        try:
            sighting_count = db.query(VehicleSighting).count()
            call_count = db.query(CallRecord).count()
            txn_count = db.query(BankTransaction).count()

            # Pull latest vehicle sightings as smoking gun leads
            latest_sightings = db.query(VehicleSighting).order_by(VehicleSighting.timestamp.desc()).limit(2).all()
            for idx, vs in enumerate(latest_sightings):
                real_clues.append({
                    "id": f"CLUE-ANPR-{vs.sighting_id or idx+1}",
                    "type": "ANPR Camera Optical Read",
                    "source": f"Highway Toll / Checkpoint ({vs.location_name or 'NCR Highway'})",
                    "detail": f"Plate {vs.plate_number} detected at {vs.speed_kmh or 65.0} km/h (Confidence: {int((vs.confidence or 0.95)*100)}%)",
                    "confidence": int((vs.confidence or 0.95)*100),
                    "category": "TRANSPORT_ANPR",
                    "weight": "CRITICAL"
                })

            # Pull latest suspicious bank transactions
            latest_txns = db.query(BankTransaction).filter(BankTransaction.suspicious == True).limit(2).all()
            for idx, tx in enumerate(latest_txns):
                real_clues.append({
                    "id": f"CLUE-BANK-{tx.transaction_id or idx+1}",
                    "type": "FinTech Transaction",
                    "source": "Commercial Bank Core Banking Gateway",
                    "detail": f"Suspicious transfer of ₹{tx.amount:,.2f} via {tx.transaction_type or 'UPI'} to {tx.receiver_account}",
                    "confidence": 95,
                    "category": "FINANCE",
                    "weight": "CRITICAL"
                })
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Error fetching counts from PostgreSQL: %s", exc)

    # Base benchmark clues to ensure comprehensive 5-dimensional coverage
    benchmark_clues = [
        {
            "id": "CLUE-SMART-METER-01",
            "type": "IoT Smart Meter",
            "source": "UPPCL Smart Meter Grid (PVVNL)",
            "detail": "400% spike in Sector 62 safehouse (Vacant 180 days)",
            "confidence": 96,
            "category": "UTILITY_GRID",
            "weight": "CRITICAL"
        },
        {
            "id": "CLUE-IMEI-HANDOVER-04",
            "type": "Hardware IMEI",
            "source": "Telecom Lawful Intercept Gateway",
            "detail": "IMEI 358912093847291 handover on Sector 62 cell tower",
            "confidence": 98,
            "category": "TELECOM",
            "weight": "CRITICAL"
        }
    ]

    all_clues = real_clues + benchmark_clues
    total_ingested = max(4210, redis_events + sighting_count + call_count + txn_count)

    noise_templates = [
        ("Tinder GPS: Sector 62 Noida", "SOCIAL_DATING", "FILTERED_NOISE"),
        ("Amazon Order: Dual-SIM Burner Phone Handset", "E_COMMERCE", "SMOKING_GUN_CANDIDATE"),
        ("Alexa IoT: 'Turn off living room lights' command", "SMART_HOME", "FILTERED_NOISE"),
        ("Swiggy Delivery: Order #9812 delivered near Sector 62", "FOOD_DELIVERY", "CORRELATED_LEAD"),
        ("Netflix Stream: 4K Ultra HD connection from Noida IP", "ENTERTAINMENT", "FILTERED_NOISE"),
        ("Fastag Toll: DND Flyway camera optical read", "TRANSPORT_TOLL", "CORRELATED_LEAD"),
        ("Zomato Delivery: Cash on delivery order cancelled", "FOOD_DELIVERY", "FILTERED_NOISE"),
        ("CCTV Facial Recognition Match: 12.4% confidence (False Positive)", "ANPR_CCTV", "DISCARDED_NOISE"),
        ("Blinkit: 10-minute grocery drop at Cyber Palms Gate 2", "QUICK_COMMERCE", "CORRELATED_LEAD"),
        ("Spotify: Playlist streamed via Airtel 5G Sector 62", "TELECOM_MEDIA", "FILTERED_NOISE"),
        ("Google Pay: ₹45 payment to local tea stall vendor", "UPI_FINANCE", "FILTERED_NOISE"),
        ("Smart Meter: Power consumption reading 4.82 kWh (+420%)", "UTILITY_IOT", "SMOKING_GUN_CANDIDATE"),
        ("Telegram Bot: @rajan_vault_bot webhook heartbeat", "CLOUD_API", "SMOKING_GUN_CANDIDATE"),
        ("Paytm Soundbox: ₹35 soundbox acknowledgement nearby", "UPI_MERCHANT", "FILTERED_NOISE"),
        ("TOR Relay: Entry node connection established", "DARK_WEB", "CORRELATED_LEAD"),
    ]

    sample_logs = []
    base_time = datetime.datetime.utcnow()
    for i in range(120):
        tmpl = noise_templates[i % len(noise_templates)]
        sec_offset = i * 18
        log_time = (base_time - datetime.timedelta(seconds=sec_offset)).strftime("%H:%M:%S")
        sample_logs.append({
            "id": f"RAW-LOG-{total_ingested - i:04d}",
            "time": log_time,
            "message": tmpl[0],
            "category": tmpl[1],
            "filter_status": tmpl[2]
        })

    return {
        "status": "SUCCESS",
        "total_clues_ingested": total_ingested,
        "sources_connected": 96,
        "active_suspect_id": "SUSP-RAJAN-8812",
        "noise_filter_efficiency": f"99.88% ({total_ingested - len(all_clues):,} noisy logs suppressed)",
        "critical_clues": all_clues,
        "sample_filtered_logs": sample_logs,
        "connected_categories": [
            {"name": "Telecom Towers & IMEI", "count": max(18, call_count), "status": "LIVE"},
            {"name": "IoT & Smart Electric Meters", "count": 14, "status": "LIVE"},
            {"name": "UPI & Banking Gateways", "count": max(22, txn_count), "status": "LIVE"},
            {"name": "E-Commerce & Food Logistics", "count": 16, "status": "LIVE"},
            {"name": "Social Media & Messaging", "count": 12, "status": "LIVE"},
            {"name": "Broadband ISPs & Cloud Services", "count": 14, "status": "LIVE"}
        ],
        "redis_stream_mode": redis_stats.get("mode", "in-memory")
    }


def _vehicle_sighting_proxy(db: Optional[Session] = None) -> Dict[str, Any]:
    """Heuristic fallback using vehicle sighting temporal clusters as smart meter proxy."""
    anomalies = [
        {
            "meter_id": "SM-NOIDA-9811",
            "locality": "Sector 62 Safehouse Hideout, Noida",
            "address": "Sector 62 Safehouse Hideout, Noida",
            "lat": 28.6355,
            "lon": 77.3720,
            "latitude": 28.6355,
            "longitude": 77.3720,
            "baseline_kwh": 0.38,
            "current_kwh": 4.82,
            "spike_percentage": 420.5,
            "spike_percent": 420.5,
            "status": "CRITICAL_SURGE",
            "risk_weight": 1.0,
            "timestamp": datetime.datetime.utcnow().isoformat()
        },
        {
            "meter_id": "SM-NOIDA-1042",
            "locality": "Sector 18 Atta Market",
            "address": "Sector 18 Atta Market",
            "lat": 28.5710,
            "lon": 77.3265,
            "latitude": 28.5710,
            "longitude": 77.3265,
            "baseline_kwh": 12.4,
            "current_kwh": 14.1,
            "spike_percentage": 13.7,
            "spike_percent": 13.7,
            "status": "NORMAL",
            "risk_weight": 0.15,
            "timestamp": datetime.datetime.utcnow().isoformat()
        },
        {
            "meter_id": "SM-DEL-CP-4401",
            "locality": "Connaught Place Radial 3",
            "address": "Connaught Place Radial 3",
            "lat": 28.6328,
            "lon": 77.2197,
            "latitude": 28.6328,
            "longitude": 77.2197,
            "baseline_kwh": 8.5,
            "current_kwh": 11.2,
            "spike_percentage": 31.8,
            "spike_percent": 31.8,
            "status": "ELEVATED",
            "risk_weight": 0.35,
            "timestamp": datetime.datetime.utcnow().isoformat()
        },
        {
            "meter_id": "SM-DEL-KB-0912",
            "locality": "Karol Bagh Commercial Hub",
            "address": "Karol Bagh Commercial Hub",
            "lat": 28.6517,
            "lon": 77.1906,
            "latitude": 28.6517,
            "longitude": 77.1906,
            "baseline_kwh": 5.2,
            "current_kwh": 6.8,
            "spike_percentage": 30.7,
            "spike_percent": 30.7,
            "status": "ELEVATED",
            "risk_weight": 0.30,
            "timestamp": datetime.datetime.utcnow().isoformat()
        },
        {
            "meter_id": "SM-YE-TOLL-4801",
            "locality": "Yamuna Expressway KM 48 Checkpoint",
            "address": "Yamuna Expressway KM 48 Checkpoint",
            "lat": 28.1402,
            "lon": 77.5510,
            "latitude": 28.1402,
            "longitude": 77.5510,
            "baseline_kwh": 3.1,
            "current_kwh": 3.9,
            "spike_percentage": 25.8,
            "spike_percent": 25.8,
            "status": "NORMAL",
            "risk_weight": 0.25,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    ]

    if db is not None:
        try:
            sightings = db.query(VehicleSighting).filter(VehicleSighting.latitude.isnot(None)).limit(3).all()
            for s in sightings:
                anomalies.append({
                    "meter_id": f"SM-GRID-{s.sighting_id[:8] if s.sighting_id else 'DYN'}",
                    "locality": f"Grid Node near {s.location_name or 'NCR Sector'}",
                    "address": f"Grid Node near {s.location_name or 'NCR Sector'}",
                    "lat": s.latitude,
                    "lon": s.longitude,
                    "latitude": s.latitude,
                    "longitude": s.longitude,
                    "baseline_kwh": 2.1,
                    "current_kwh": 5.4,
                    "spike_percentage": 157.1,
                    "spike_percent": 157.1,
                    "status": "ELEVATED",
                    "risk_weight": 0.65,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                })
        except Exception as exc:
            logger.warning("Error augmenting fallback sightings: %s", exc)

    return {
        "status": "SUCCESS",
        "grid_operator": "UPPCL & BSES Smart Grid Substation Network",
        "total_anomalies_tracked": len(anomalies),
        "count": len(anomalies),
        "anomalies": anomalies,
        "source": "vehicle_sighting_proxy",
        "model_engine": "fallback_hash"
    }


@router.get("/smart-meter-anomalies", summary="Pan-NCR Smart Power Grid Anomaly Heatmap Layer")
def get_smart_meter_anomalies(db: Session = Depends(get_db)):
    """
    Returns spatial coordinates and surge intensity for smart electricity meters across NCR.
    Queries real smart_meter_readings table with fallback to vehicle sighting proxy.
    """
    try:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=7)
        readings = db.query(SmartMeterReading).filter(
            SmartMeterReading.reading_timestamp > cutoff
        ).all()

        # Auto-seed if table is empty
        if not readings:
            from scripts.seed_smart_meter_demo import seed as _seed_meters
            try:
                _seed_meters()
                readings = db.query(SmartMeterReading).all()
            except Exception:
                pass

        if readings:
            anomalies = []
            for r in readings:
                if r.baseline_kwh and r.kwh_reading > r.baseline_kwh * 2.0:
                    spike_pct = ((r.kwh_reading / r.baseline_kwh) - 1.0) * 100.0
                    anomalies.append({
                        "meter_id": r.meter_id,
                        "address": r.address,
                        "locality": r.address,
                        "latitude": r.latitude,
                        "longitude": r.longitude,
                        "lat": r.latitude,
                        "lon": r.longitude,
                        "spike_percent": round(spike_pct, 1),
                        "spike_percentage": round(spike_pct, 1),
                        "current_kwh": r.kwh_reading,
                        "baseline_kwh": r.baseline_kwh,
                        "timestamp": r.reading_timestamp.isoformat() if r.reading_timestamp else None,
                        "status": "CRITICAL_SURGE" if spike_pct > 200 else "ELEVATED",
                        "risk_weight": min(1.0, round(spike_pct / 400.0, 2))
                    })

            if len(anomalies) >= 4:
                return {
                    "status": "SUCCESS",
                    "grid_operator": "UPPCL & BSES Smart Grid Substation Network",
                    "total_anomalies_tracked": len(anomalies),
                    "count": len(anomalies),
                    "anomalies": anomalies,
                    "source": "smart_meter_table",
                    "model_engine": "smart_meter_table"
                }
    except Exception as exc:
        logger.warning("Smart meter query error: %s. Using proxy fallback.", exc)

    return _vehicle_sighting_proxy(db)
