"""
CRIMENEXUS Operation Shatter - Criminal Escape Simulation Orchestrator.

Simulates Kingpin "Rajan" attempting a 3-step escape and demonstrates how the
CRIMENEXUS AI defense stack defeats him at each phase:
- Step 1: The Vehicle Swap (ANPR & Fusion Engine cross-correlates FASTag ID & chassis texture)
- Step 2: The Smurfing Liquidation (Isolation Forest detects 10 mule accounts ₹49,000 each -> Section 106 BNSS Freeze Notice)
- Step 3: The Safehouse Hideout (Adamic-Adar Link Prediction resolves Sector 62 safehouse at 88% confidence + QAOA/OSRM intercept for PCR-04)
"""

import time
import logging
from typing import Dict, Any

from app.ml_service.link_predictor import ExplainableLinkPredictor
from app.quantum.quantum_router import QuantumInterceptOptimizer, haversine_km

logger = logging.getLogger("crimenexus.escape_simulator")


class OperationShatterSimulator:
    """Orchestrates the 3-step interactive criminal escape scenario."""

    def __init__(self):
        self.link_predictor = ExplainableLinkPredictor()
        self.quantum_router = QuantumInterceptOptimizer()

    def execute_step_1(self) -> Dict[str, Any]:
        """
        Step 1: The Vehicle Swap.
        Rajan swaps license plate from TS 09 AB 1234 to DL 01 XY 9876.
        Fusion Engine matches optical chassis texture and RFID FASTag ID.
        """
        original_plate = "TS 09 AB 1234"
        cloned_plate = "DL 01 XY 9876"
        fastag_id = "TAG-IND-8812049-MHA"

        return {
            "status": "SUCCESS",
            "step": 1,
            "phase": "ANPR_FUSION",
            "attempt_name": "The Vehicle Swap",
            "criminal_action": f"Rajan swaps license plate from {original_plate} to cloned plate {cloned_plate} under Sector 18 flyover.",
            "countermeasure": "Fusion Engine correlates RFID FASTag beacon and optical vehicle chassis contour against CCTNS database.",
            "fusion_alert": "Cloned Plate Detected. True owner: Rajan. Vector: Southbound on Yamuna Expressway.",
            "fastag_id": fastag_id,
            "original_plate": original_plate,
            "cloned_plate": cloned_plate,
            "chassis_match_confidence": 96.8,
            "optical_classifier": "ResNet-50 Vehicle Make & Model Classifier (Black Mahindra Scorpio S11)",
            "camera_location": "Yamuna Toll Plaza KM 48 (Lane 4 ANPR Interceptor)",
            "coordinates": {
                "lat": 28.1402,
                "lon": 77.5510,
                "name": "Yamuna Toll Plaza KM 48"
            },
            "speed_kmh": 118.5,
            "action_taken": "Automated alert flashed to PCR patrol units. Toll barrier pre-emption triggered.",
            "toast_message": "FUSION ENGINE: FASTag Link Identified. Plate swapped, but suspect identified.",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    def execute_step_2(self) -> Dict[str, Any]:
        """
        Step 2: The Smurfing Liquidation.
        Rajan panics and attempts to move ₹4,90,000 to crypto exchange via 10 mule accounts (₹49,000 each).
        IsolationForest flags velocity & structuring anomaly -> Section 106 BNSS Freeze Notice.
        """
        mule_accounts = [
            {"account_number": "ACC-HDFC-908122", "bank": "HDFC Bank", "amount_inr": 49000, "status": "DEBIT_FROZEN"},
            {"account_number": "ACC-ICICI-441092", "bank": "ICICI Bank", "amount_inr": 49000, "status": "DEBIT_FROZEN"},
            {"account_number": "ACC-SBI-778102", "bank": "State Bank of India", "amount_inr": 49000, "status": "DEBIT_FROZEN"},
            {"account_number": "ACC-AXIS-331902", "bank": "Axis Bank", "amount_inr": 49000, "status": "DEBIT_FROZEN"},
            {"account_number": "ACC-KOTAK-110293", "bank": "Kotak Mahindra Bank", "amount_inr": 49000, "status": "DEBIT_FROZEN"},
            {"account_number": "ACC-PNB-559102", "bank": "Punjab National Bank", "amount_inr": 49000, "status": "DEBIT_FROZEN"},
            {"account_number": "ACC-BOB-881290", "bank": "Bank of Baroda", "amount_inr": 49000, "status": "DEBIT_FROZEN"},
            {"account_number": "ACC-YES-661029", "bank": "Yes Bank", "amount_inr": 49000, "status": "DEBIT_FROZEN"},
            {"account_number": "ACC-INDUS-220194", "bank": "IndusInd Bank", "amount_inr": 49000, "status": "DEBIT_FROZEN"},
            {"account_number": "ACC-PAYTM-991042", "bank": "Paytm Payments Bank", "amount_inr": 49000, "status": "DEBIT_FROZEN"},
        ]

        total_amount = sum(a["amount_inr"] for a in mule_accounts)
        anomaly_score = 0.94

        return {
            "status": "SUCCESS",
            "step": 2,
            "phase": "ISOLATION_FOREST_BNSS",
            "attempt_name": "The Smurfing Liquidation",
            "criminal_action": f"Rajan panics and attempts to move ₹{total_amount:,} to a crypto exchange via 10 mule accounts (₹49,000 each below RBI reporting threshold).",
            "countermeasure": f"Scikit-Learn IsolationForest anomaly detector flags transaction velocity (Anomaly Score: {anomaly_score}). RAG engine auto-generates Section 106 BNSS Freeze Notice.",
            "hud_message": "Mule Ring Detected. 10 accounts frozen before cashout.",
            "isolation_forest_score": anomaly_score,
            "threshold_rule": "Transactions < ₹50,000 occurring within a 3-minute sliding window (Structuring / Smurfing pattern)",
            "accounts_frozen_count": len(mule_accounts),
            "total_frozen_amount_inr": total_amount,
            "target_crypto_wallet": "0x71C...B29 (Trc20 Cold Storage Mixer)",
            "statutory_mandate": "Section 106 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Section 5 PMLA",
            "freeze_notice_id": "BNSS-SEC106-FRZ-2026-90812",
            "mule_accounts": mule_accounts,
            "toast_message": "ISOLATION FOREST: Smurfing Anomaly (Score: 0.94). Section 106 BNSS Freeze auto-generated.",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    def execute_step_3(self) -> Dict[str, Any]:
        """
        Step 3: The Safehouse Hideout.
        Rajan powers off his phone to create RF silence and navigates to a safehouse.
        Adamic-Adar Link Prediction predicts Sector 62 Noida safehouse with 88% confidence.
        QAOA / OSRM routes PCR-04 to intercept him.
        """
        # Dynamic QAOA / OSRM Intercept calculation
        safehouse_coords = {"lat": 28.6280, "lon": 77.3649, "address": "Flat 402, Block C, Green View Apartments, Sector 62, Noida"}
        pcr_unit_coords = {"lat": 28.6180, "lon": 77.3780, "name": "PCR Van Alpha-04 (Jewar/Noida Patrol)"}

        # Calculate haversine distance
        dist_km = haversine_km(pcr_unit_coords["lat"], pcr_unit_coords["lon"], safehouse_coords["lat"], safehouse_coords["lon"])
        dist_km = max(1.8, round(dist_km * 1.15, 2))
        eta_minutes = round((dist_km / 45.0) * 60, 1)

        # Precise road trajectory coordinates for MapLibre
        intercept_route_coords = [
            [77.3780, 28.6180],  # PCR unit starting point
            [77.3740, 28.6205],
            [77.3705, 28.6235],
            [77.3670, 28.6260],
            [77.3649, 28.6280],  # Sector 62 safehouse
        ]

        return {
            "status": "SUCCESS",
            "step": 3,
            "phase": "LINK_PREDICTION_QAOA",
            "attempt_name": "The Safehouse Hideout",
            "criminal_action": "Rajan turns off phone to create RF radio-silence and drives to an unmapped safehouse in Sector 62 Noida.",
            "countermeasure": "Adamic-Adar Link Prediction resolves destination (88% probability) via associate Vikram's recent supply logistics. QAOA / OSRM routes PCR-04.",
            "link_prediction": {
                "algorithm": "Topological Adamic-Adar & Heterogeneous GNN",
                "predicted_destination": safehouse_coords["address"],
                "confidence_percentage": 88.0,
                "shared_triangles": [
                    "Associate Vikram purchased ration supplies at Sector 62 grocery store at 14:10 IST",
                    "Burner phone +91 98111 22334 co-located with Vikram in Sector 62",
                    "Historical utility connection linked to proxy identity Suresh Kumar"
                ],
                "explainability_card": "AI LINK PREDICTION: 88% probability target is heading to Sector 62 Noida safehouse."
            },
            "quantum_optimization": {
                "algorithm": "QAOA (Quantum Approximate Optimization Algorithm)",
                "evaluations": 1024,
                "state": "Optimal intercept vector converged in 12ms",
                "responding_unit": pcr_unit_coords["name"],
                "distance_km": dist_km,
                "duration_minutes": 11.4,
            },
            "spatial_data": {
                "rajan_target": {
                    "latitude": safehouse_coords["lat"],
                    "longitude": safehouse_coords["lon"],
                    "label": "Rajan (Target Scorpio DL 01 XY 9876)",
                    "pin_color": "#dc2626"
                },
                "pcr_unit": {
                    "latitude": pcr_unit_coords["lat"],
                    "longitude": pcr_unit_coords["lon"],
                    "label": pcr_unit_coords["name"],
                    "pin_color": "#2563eb"
                },
                "intercept_route": {
                    "coordinates": intercept_route_coords,
                    "distance_km": dist_km,
                    "duration_minutes": 11.4,
                    "color": "#10b981",
                    "style": "dashed"
                }
            },
            "finale": {
                "contained_in_minutes": 11.4,
                "remand_clock_hours": 24,
                "banner_message": "CRIMENEXUS INTERCEPT SUCCESSFUL. Suspect contained in 11.4 minutes. Remand Clock started.",
                "toast_message": "AI LINK PREDICTION: 88% probability target is heading to Sector 62 Noida safehouse."
            },
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    def execute_all_steps(self) -> Dict[str, Any]:
        """Runs all 3 steps in sequence for full scenario reporting."""
        return {
            "scenario": "Operation Shatter: Kingpin Rajan Escape Simulation",
            "step_1": self.execute_step_1(),
            "step_2": self.execute_step_2(),
            "step_3": self.execute_step_3(),
            "summary": "CRIMENEXUS defeated all 3 evasion tactics: ANPR plate swap defeated via FASTag correlation, smurfing defeated via IsolationForest, and physical safehouse hideout defeated via Adamic-Adar Link Prediction + QAOA intercept."
        }


_escape_simulator_instance = None


def get_escape_simulator() -> OperationShatterSimulator:
    """Singleton getter for Operation Shatter Escape Simulator."""
    global _escape_simulator_instance
    if _escape_simulator_instance is None:
        _escape_simulator_instance = OperationShatterSimulator()
    return _escape_simulator_instance
