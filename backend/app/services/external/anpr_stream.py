import random
import uuid
from datetime import datetime
from typing import Dict, Any, List

# Key toll plazas and junction cameras across NCR and national transit corridors
ANPR_CHECKPOINTS = [
    {"checkpoint_id": "ANPR-UP-YAMUNA-KM48", "name": "Yamuna Expressway Jewar Toll KM 48", "lat": 28.1402, "lon": 77.5510, "lane": "Lane 03 (Outbound)"},
    {"checkpoint_id": "ANPR-DL-DND-TOLL", "name": "DND Flyway Mayur Vihar Toll", "lat": 28.5830, "lon": 77.2910, "lane": "Lane 07 (Inbound)"},
    {"checkpoint_id": "ANPR-HR-KMP-EXPR", "name": "Western Peripheral (KMP) Badli Junction", "lat": 28.6010, "lon": 76.8120, "lane": "Lane 01 (Heavy Corridor)"},
    {"checkpoint_id": "ANPR-UP-NOIDA-SEC62", "name": "Sector 62 Model Town Intersection ANPR", "lat": 28.6280, "lon": 77.3649, "lane": "Camera 02 Northbound"}
]

# Blacklisted vehicles for automatic intercept triggering
ANPR_HOTLIST = {
    "DL01AB1234": {"level": "CRITICAL", "reason": "Section 384/120B Extortion Syndicate flagship vehicle", "owner": "Vikram Malhotra"},
    "UP16CD5678": {"level": "HIGH", "reason": "Courier vehicle identified in hawala cash drops", "owner": "Ramesh Kumar"},
    "HR26DQ9911": {"level": "MEDIUM", "reason": "Vehicle associated with loan app scam call center", "owner": "Pooja Sharma"}
}


def simulate_anpr_detections(count: int = 5) -> List[Dict[str, Any]]:
    """
    Simulates real-time telemetry from city and highway camera grids.
    Matches plates against hotlists and generates instant interception alerts.
    """
    results = []
    pool_plates = [
        "DL01AB1234",  # Wanted (Vikram Malhotra)
        "UP16CD5678",  # Wanted (Ramesh Kumar)
        "DL3CB9012",
        "HR26DQ9911",  # Flagged
        "KA01MJ4091",
        "UP14ER1029",
        "DL8CX5521"
    ]

    selected = random.sample(pool_plates, min(count, len(pool_plates)))

    for plate in selected:
        cp = random.choice(ANPR_CHECKPOINTS)
        is_hotlisted = plate in ANPR_HOTLIST
        hotlist_info = ANPR_HOTLIST.get(plate, None)

        detection = {
            "detection_id": str(uuid.uuid4())[:8],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "license_plate": plate,
            "confidence_score": round(random.uniform(92.5, 99.8), 1),
            "checkpoint_id": cp["checkpoint_id"],
            "checkpoint_name": cp["name"],
            "latitude": cp["lat"],
            "longitude": cp["lon"],
            "lane": cp["lane"],
            "speed_kmh": random.randint(45, 115),
            "hotlist_match": is_hotlisted,
            "alert_level": hotlist_info["level"] if hotlist_info else "NONE",
            "alert_reason": hotlist_info["reason"] if hotlist_info else "Routine Traffic Scan",
            "recommended_police_action": "DISPATCH_PCR_INTERCEPT" if is_hotlisted else "NO_ACTION"
        }
        results.append(detection)

    return results
