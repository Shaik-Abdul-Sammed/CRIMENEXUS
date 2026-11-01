import hashlib
import logging
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger("crimenexus.external.vahan")

# Pre-seeded test vehicle database matching simulated crime networks
VAHAN_REGISTRY: Dict[str, Dict[str, Any]] = {
    "DL01AB1234": {
        "owner_name": "Vikram Malhotra",
        "vehicle_class": "Motor Car (LMV)",
        "make_model": "Toyota Fortuner 4x4",
        "color": "Pearl White",
        "chassis_number": "MBJ11F498A1920394",
        "engine_number": "2GDFTV982310",
        "fuel_type": "DIESEL",
        "rto": "DL-01 Mall Road RTO, New Delhi",
        "registration_date": "2021-04-12",
        "fitness_valid_upto": "2036-04-11",
        "insurance_status": "ACTIVE",
        "stolen_or_wanted_status": "WANTED_INTERCEPT",
        "alert_remarks": "Vehicle flagged in Sector 62 Extortion Syndicate"
    },
    "UP16CD5678": {
        "owner_name": "Ramesh Kumar",
        "vehicle_class": "Motor Car (LMV)",
        "make_model": "Hyundai Creta SX",
        "color": "Phantom Black",
        "chassis_number": "MALC811CL0928371",
        "engine_number": "G4FJLM837192",
        "fuel_type": "PETROL",
        "rto": "UP-16 Gautam Buddha Nagar, Noida",
        "registration_date": "2022-08-19",
        "fitness_valid_upto": "2037-08-18",
        "insurance_status": "EXPIRED",
        "stolen_or_wanted_status": "FLAGGED_SURVEILLANCE",
        "alert_remarks": "Linked to Hawala courier transit routes"
    },
    "KA01MJ4091": {
        "owner_name": "Aditya Verma",
        "vehicle_class": "Motor Cycle",
        "make_model": "Bajaj Pulsar NS200",
        "color": "Wild Red",
        "chassis_number": "MD2A12CY981293810",
        "engine_number": "DKX8912739",
        "fuel_type": "PETROL",
        "rto": "KA-01 Koramangala, Bengaluru",
        "registration_date": "2023-01-05",
        "fitness_valid_upto": "2038-01-04",
        "insurance_status": "ACTIVE",
        "stolen_or_wanted_status": "CLEAR",
        "alert_remarks": "No adverse records found"
    }
}


def lookup_vahan_vehicle(plate_number: str) -> Dict[str, Any]:
    """
    Simulates / queries the MoRTH VAHAN 4.0 National Vehicle Registry.
    Standardizes plate formats (removing spaces and hyphens) and returns official ownership & theft records.
    """
    clean_plate = plate_number.upper().replace("-", "").replace(" ", "").strip()

    if clean_plate in VAHAN_REGISTRY:
        record = VAHAN_REGISTRY[clean_plate]
        return {
            "query_plate": clean_plate,
            "status": "RECORD_FOUND",
            "source": "MoRTH VAHAN 4.0 National Register",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "details": record
        }

    # Deterministic fallback synthesizer for plates not in pre-seeded list
    state_code = clean_plate[:2] if len(clean_plate) >= 2 else "DL"
    chassis_seed = hashlib.md5(clean_plate.encode()).hexdigest().upper()[:17]
    engine_seed = hashlib.sha1(clean_plate.encode()).hexdigest().upper()[:12]

    return {
        "query_plate": clean_plate,
        "status": "RECORD_FOUND",
        "source": "MoRTH VAHAN 4.0 National Register",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "details": {
            "owner_name": f"Registered Citizen ({clean_plate})",
            "vehicle_class": "Motor Car (LMV)",
            "make_model": "Maruti Suzuki Swift Dzire",
            "color": "Silver",
            "chassis_number": f"MB{chassis_seed}",
            "engine_number": f"EN{engine_seed}",
            "fuel_type": "PETROL / CNG",
            "rto": f"{state_code} Central Regional Transport Office",
            "registration_date": "2020-05-15",
            "fitness_valid_upto": "2035-05-14",
            "insurance_status": "ACTIVE",
            "stolen_or_wanted_status": "CLEAR",
            "alert_remarks": "No active lookout orders found"
        }
    }
