"""
CRIMENEXUS Escape Simulation & Omni-Trace API Endpoints.

Provides:
- GET /api/v1/escape-demo/omni-trace/{suspect_id}
- GET /api/v1/escape-demo/data-lake
- GET /api/v1/escape-demo/smart-meter-anomalies
"""

import random
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Path, Query, Depends
from app.services.streaming.omni_footprint_simulator import get_omni_footprint_simulator
from app.services.streaming.digital_exhaust_simulator import get_digital_exhaust_simulator
from app.services.streaming.escape_simulator import get_escape_simulator
from app.security.authentication import get_current_user
from app.models.user import User

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
def get_data_lake_clues(current_user: User = Depends(get_current_user)):
    """
    Visualizes ingestion of all 96 digital clue sources across India (Telecom, IoT,
    Social Media, E-commerce, Utilities, and Finance), isolating the top smoking guns
    from 4,210 background noise signals.
    """
    critical_clues = [
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
            "id": "CLUE-ECOM-DELIVERY-02",
            "type": "E-commerce",
            "source": "Amazon India Logistics Webhook",
            "detail": "Amazon burner phone delivery to Sector 62 drop-box",
            "confidence": 92,
            "category": "E_COMMERCE",
            "weight": "HIGH"
        },
        {
            "id": "CLUE-CLOUD-BACKUP-03",
            "type": "Cloud",
            "source": "Google Drive Sync Lawful Intercept",
            "detail": "Google Drive backup from Noida static residential IP (122.161.44.89)",
            "confidence": 88,
            "category": "CLOUD_TELEMETRY",
            "weight": "HIGH"
        },
        {
            "id": "CLUE-IMEI-HANDOVER-04",
            "type": "Hardware IMEI",
            "source": "Telecom Lawful Intercept Gateway",
            "detail": "IMEI 358912093847291 handover on Sector 62 cell tower",
            "confidence": 98,
            "category": "TELECOM",
            "weight": "CRITICAL"
        },
        {
            "id": "CLUE-UPI-CAB-05",
            "type": "FinTech Mobility",
            "source": "NPCI UPI / Uber India Gateway",
            "detail": "Cab fare paid via rajan.bhai@okhdfcbank to Noida destination",
            "confidence": 94,
            "category": "FINANCE",
            "weight": "HIGH"
        }
    ]

    # Pre-generate diverse noise logs to simulate the 4,210 raw events
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
        ("Uber Ride: Swift Dzire trip completed at Sector 62", "RIDE_HAIL", "SMOKING_GUN_CANDIDATE"),
        ("WhatsApp Call: End-to-end encrypted VoIP packet burst", "MESSAGING", "CORRELATED_LEAD"),
        ("Instagram Login: Web session from Chromium on Ubuntu", "SOCIAL_MEDIA", "FILTERED_NOISE"),
        ("Smart Meter: Power consumption reading 4.82 kWh (+420%)", "UTILITY_IOT", "SMOKING_GUN_CANDIDATE"),
        ("Truecaller Ping: Spam report on unregistered burner SIM", "TELEPHONY", "FILTERED_NOISE"),
        ("Telegram Bot: @rajan_vault_bot webhook heartbeat", "CLOUD_API", "SMOKING_GUN_CANDIDATE"),
        ("Aadhaar e-KYC: Inactive query token verified", "IDENTITY_UIDAI", "FILTERED_NOISE"),
        ("CRED Alert: Credit card reward points redeemed", "FINTECH", "FILTERED_NOISE"),
        ("Paytm Soundbox: ₹35 soundbox acknowledgement nearby", "UPI_MERCHANT", "FILTERED_NOISE"),
        ("Cisco Meraki AP: Wi-Fi probe request with MAC randomized", "WIFI_PROBE", "CORRELATED_LEAD"),
        ("Zepto Delivery: Packaged water bottles delivered", "QUICK_COMMERCE", "FILTERED_NOISE"),
        ("Google Maps: Navigation query for 'Yamuna Expressway Toll'", "SEARCH_GEO", "CORRELATED_LEAD"),
        ("Ola Cabs: Ride cancelled by driver at Karol Bagh", "RIDE_HAIL", "FILTERED_NOISE"),
        ("Air Quality Sensor: Indoor PM2.5 change detected", "ENVIRONMENTAL_IOT", "FILTERED_NOISE"),
        ("YouTube Music: Background audio streaming", "ENTERTAINMENT", "FILTERED_NOISE"),
        ("TOR Relay: Entry node connection established", "DARK_WEB", "CORRELATED_LEAD"),
        ("ATM Pin Verification: Invalid PIN entered at HDFC ATM", "BANKING_ATM", "CORRELATED_LEAD"),
        ("Flipkart Delivery: Parcel in-transit via Sector 63 hub", "E_COMMERCE", "FILTERED_NOISE"),
        ("BSNL Landline: Auto-dialer disconnect logged", "TELECOM", "FILTERED_NOISE"),
    ]

    sample_logs = []
    base_time = datetime.datetime.utcnow()
    for i in range(120):
        tmpl = noise_templates[i % len(noise_templates)]
        sec_offset = i * 18
        log_time = (base_time - datetime.timedelta(seconds=sec_offset)).strftime("%H:%M:%S")
        sample_logs.append({
            "id": f"RAW-LOG-{4210 - i:04d}",
            "time": log_time,
            "message": tmpl[0],
            "category": tmpl[1],
            "filter_status": tmpl[2]
        })

    return {
        "status": "SUCCESS",
        "total_clues_ingested": 4210,
        "sources_connected": 96,
        "active_suspect_id": "SUSP-RAJAN-8812",
        "noise_filter_efficiency": "99.88% (4,205 noisy logs suppressed)",
        "critical_clues": critical_clues,
        "sample_filtered_logs": sample_logs,
        "connected_categories": [
            {"name": "Telecom Towers & IMEI", "count": 18, "status": "LIVE"},
            {"name": "IoT & Smart Electric Meters", "count": 14, "status": "LIVE"},
            {"name": "UPI & Banking Gateways", "count": 22, "status": "LIVE"},
            {"name": "E-Commerce & Food Logistics", "count": 16, "status": "LIVE"},
            {"name": "Social Media & Messaging", "count": 12, "status": "LIVE"},
            {"name": "Broadband ISPs & Cloud Services", "count": 14, "status": "LIVE"}
        ]
    }


@router.get("/smart-meter-anomalies", summary="Pan-NCR Smart Power Grid Anomaly Heatmap Layer")
def get_smart_meter_anomalies():
    """
    Returns spatial coordinates and surge intensity for smart electricity meters across NCR.
    Used by MapIntelligencePage to render the Smart Meter Heatmap layer.
    """
    return {
        "status": "SUCCESS",
        "grid_operator": "UPPCL & BSES Smart Grid Substation Network",
        "anomalies": [
            {
                "meter_id": "SM-NOIDA-9811",
                "locality": "Sector 62, Noida (Target Safehouse)",
                "lat": 28.6280,
                "lon": 77.3649,
                "baseline_kwh": 0.38,
                "current_kwh": 4.82,
                "spike_percentage": 420.5,
                "status": "CRITICAL_SURGE",
                "risk_weight": 1.0
            },
            {
                "meter_id": "SM-NOIDA-1042",
                "locality": "Sector 18 Atta Market",
                "lat": 28.5710,
                "lon": 77.3265,
                "baseline_kwh": 12.4,
                "current_kwh": 14.1,
                "spike_percentage": 13.7,
                "status": "NORMAL",
                "risk_weight": 0.15
            },
            {
                "meter_id": "SM-DEL-CP-4401",
                "locality": "Connaught Place Radial 3",
                "lat": 28.6328,
                "lon": 77.2197,
                "baseline_kwh": 8.5,
                "current_kwh": 11.2,
                "spike_percentage": 31.8,
                "status": "ELEVATED",
                "risk_weight": 0.35
            },
            {
                "meter_id": "SM-DEL-KB-0912",
                "locality": "Karol Bagh Commercial Hub",
                "lat": 28.6517,
                "lon": 77.1906,
                "baseline_kwh": 5.2,
                "current_kwh": 6.8,
                "spike_percentage": 30.7,
                "status": "ELEVATED",
                "risk_weight": 0.30
            },
            {
                "meter_id": "SM-YE-TOLL-4801",
                "locality": "Yamuna Expressway KM 48 Checkpoint",
                "lat": 28.1402,
                "lon": 77.5510,
                "baseline_kwh": 3.1,
                "current_kwh": 3.9,
                "spike_percentage": 25.8,
                "status": "NORMAL",
                "risk_weight": 0.25
            }
        ]
    }
