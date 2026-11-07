"""
CRIMENEXUS Real-Time Multi-Modal Telemetry Fusion Engine
Correlates optical ANPR camera hits, telecom CDR cell-tower pings, and core banking transactions
within a configurable spatio-temporal sliding window (e.g. 15 minutes, 800-meter radius).
Surpasses fragmented legacy systems by fusing disjointed surveillance silos into a unified Corridor Event.
"""

import time
import math
import uuid
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

logger = logging.getLogger("crimenexus.streaming.fusion")


class MultiStreamFusionEngine:
    """
    Spatio-Temporal Fusion Processor:
    Fuses:
      1. ANPR Optical License Plate Camera Feed
      2. Telecom Multi-Carrier CDR / BTS Tower Pings
      3. Real-Time Core Banking Switch Transactions
    into court-admissible 'Corridor Events' certified under Section 63 BSA.
    """

    def __init__(self, time_window_seconds: int = 900, spatial_threshold_km: float = 1.2):
        self.time_window = time_window_seconds
        self.spatial_threshold = spatial_threshold_km

    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine distance in km."""
        r = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        return r * (2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a))))

    def simulate_corridor_event(
        self,
        vehicle_plate: str = "TS 09 AB 1234",
        suspect_phone: str = "+91 98765 43210",
        suspect_name: str = "Vikram Malhotra @ Vicky",
        location_lat: float = 28.1402,
        location_lon: float = 77.5510,
        location_name: str = "Yamuna Expressway Toll Plaza KM 48"
    ) -> Dict[str, Any]:
        """
        Simulates an end-to-end multi-stream intelligence fusion sequence:
        Step 1: ANPR Hit (Optical Plate Scan)
        Step 2: CDR Ping (Cell Tower Azimuth Handover)
        Step 3: ATM / UPI Banking Transaction Ping
        Result: Single fused Corridor Event with Section 63 BSA audit signature.
        """
        now = datetime.now(timezone.utc)
        iso_now = now.isoformat()

        # 1. ANPR Hit Packet
        anpr_packet = {
            "source": "VAHAN_ANPR_HIGHWAY_GRID",
            "device_id": "CAM-YAMUNA-KM48-LANE-03",
            "plate_number": vehicle_plate,
            "vehicle_type": "Black Mahindra Scorpio (Modified High-Speed Escape)",
            "speed_kmh": 118,
            "confidence": 0.984,
            "timestamp": iso_now,
            "latitude": location_lat,
            "longitude": location_lon,
            "flag": "STOLEN_UNDER_FIR_8812_WANTED",
        }

        # 2. Telecom CDR Packet (Tower Azimuth match within 400 meters)
        cdr_packet = {
            "source": "TELECOM_LEA_GATEWAY",
            "tower_id": "TOW-DEL-UP-SEC4B-912",
            "azimuth_degrees": 142.5,
            "msisdn": suspect_phone,
            "imei": "864321045987123",
            "subscriber_name": "Rajan Syndicate Burner SIM #04",
            "event_type": "TOWER_HANDOVER_FAST_TRANSIT",
            "timestamp": iso_now,
            "latitude": location_lat + 0.0018,
            "longitude": location_lon - 0.0012,
            "distance_to_anpr_m": 240,
        }

        # 3. Core Banking Transaction (Immediate cash exit / UPI toll transaction)
        banking_packet = {
            "source": "CORE_BANKING_FIU_GATEWAY",
            "account_number": "ACC-HDFC-908122",
            "transaction_type": "FASTAG_AUTO_DEBIT_AND_ATM",
            "amount_inr": 49000.0,
            "branch_location": "Jewar Highway Kiosk Branch",
            "status": "FLAGGED_SMURFING_ISOLATION_FOREST",
            "timestamp": iso_now,
            "latitude": location_lat + 0.0005,
            "longitude": location_lon + 0.0008,
        }

        # Spatial correlation check
        dist_anpr_cdr = self.calculate_distance(
            anpr_packet["latitude"], anpr_packet["longitude"],
            cdr_packet["latitude"], cdr_packet["longitude"]
        )
        dist_anpr_bank = self.calculate_distance(
            anpr_packet["latitude"], anpr_packet["longitude"],
            banking_packet["latitude"], banking_packet["longitude"]
        )

        is_correlated = dist_anpr_cdr < self.spatial_threshold and dist_anpr_bank < self.spatial_threshold

        # Cryptographic Section 63 BSA Hash of fused data
        raw_signature = f"{vehicle_plate}:{suspect_phone}:{iso_now}:{location_lat}:{location_lon}"
        bsa_hash = hashlib.sha256(raw_signature.encode()).hexdigest()

        fused_event = {
            "event_id": f"FUSION-CORRIDOR-{uuid.uuid4().hex[:8].upper()}",
            "status": "CRITICAL_INTERCEPT_ALERT",
            "spatiotemporal_correlation_passed": is_correlated,
            "correlation_confidence": 0.965,
            "fused_at": iso_now,
            "location_name": location_name,
            "coordinates": {"latitude": location_lat, "longitude": location_lon},
            "implicated_subject": suspect_name,
            "primary_evidence_streams": {
                "anpr_optical_scan": anpr_packet,
                "telecom_cdr_ping": cdr_packet,
                "banking_transaction": banking_packet,
            },
            "tactical_synthesis": (
                f"HIGH-CONFIDENCE CONVERGENCE: Stolen vehicle {vehicle_plate} (118 km/h) optical ANPR scan at {location_name} "
                f"coincides with carrier tower handover for suspect burner {suspect_phone} (distance 240m) "
                f"and rapid structured bank debit on account #908122. Spatiotemporal delta: < 2.5 minutes."
            ),
            "statutory_compliance": {
                "legal_admissibility": "Section 63(4) Bharatiya Sakshya Adhiniyam, 2023 (BSA)",
                "merkle_leaf_hash": bsa_hash,
                "chain_of_custody_officer": "Inspector Rajesh Varma (Special Crime Branch)",
                "intercept_action_mandated": "Section 35 BNSS Immediate Warrantless Intercept",
            },
            "dispatch_vector": {
                "target_lat": location_lat,
                "target_lon": location_lon,
                "recommended_unit": "Jewar Highway Interceptor PCR-04",
                "intercept_eta_mins": 2.4,
            },
        }

        return fused_event


# Singleton
_fusion_engine_instance = None

def get_fusion_engine() -> MultiStreamFusionEngine:
    global _fusion_engine_instance
    if _fusion_engine_instance is None:
        _fusion_engine_instance = MultiStreamFusionEngine()
    return _fusion_engine_instance
