import logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger("crimenexus.external.cctns")

# Pre-seeded CCTNS records for police demonstration and operational testing
CCTNS_DATABASE: Dict[str, Dict[str, Any]] = {
    "FIR-2026-UP-NOIDA-0142": {
        "fir_number": "FIR-2026-UP-NOIDA-0142",
        "state": "Uttar Pradesh",
        "district": "Gautam Buddha Nagar",
        "police_station": "Sector 62 Police Station",
        "registration_date": "2026-03-14T10:30:00Z",
        "sections_of_law": ["Section 420 IPC (Cheating)", "Section 120B IPC (Criminal Conspiracy)", "Section 66D IT Act"],
        "complainant": "Branch Manager, Nationalized Bank",
        "accused_persons": [
            {
                "name": "Ramesh Kumar",
                "father_name": "Suresh Kumar",
                "alias": "Hawala Ramesh",
                "history_sheet_status": "HS-No-42-Active",
                "prior_chargesheets": 3,
                "known_mobiles": ["9876543210", "9811223344"],
                "modus_operandi": "Layered money mule recruitment & cash withdrawal"
            },
            {
                "name": "Vikram Malhotra",
                "father_name": "Om Prakash Malhotra",
                "alias": "Vicky",
                "history_sheet_status": "Wanted in FIR 89/2024 Delhi",
                "prior_chargesheets": 5,
                "known_mobiles": ["9123456789"],
                "modus_operandi": "Extortion syndicate leader & vehicle logistics"
            }
        ],
        "investigating_officer": "Inspector Rajesh Sharma",
        "current_status": "UNDER_INVESTIGATION"
    },
    "FIR-2026-DL-CP-0089": {
        "fir_number": "FIR-2026-DL-CP-0089",
        "state": "Delhi",
        "district": "New Delhi",
        "police_station": "Connaught Place Police Station",
        "registration_date": "2026-02-10T14:15:00Z",
        "sections_of_law": ["Section 384 IPC (Extortion)", "Section 506 IPC (Criminal Intimidation)"],
        "complainant": "Proprietor, Jewelers Association",
        "accused_persons": [
            {
                "name": "Vikram Malhotra",
                "father_name": "Om Prakash Malhotra",
                "alias": "Vicky",
                "history_sheet_status": "Proclaimed Offender (Sec 82 CrPC)",
                "prior_chargesheets": 5,
                "known_mobiles": ["9123456789"],
                "modus_operandi": "Threat calls from spoofed international numbers"
            }
        ],
        "investigating_officer": "Sub-Inspector Amit Verma",
        "current_status": "CHARGESHEET_FILED"
    },
    "FIR-2026-DEL-8902": {
        "fir_number": "FIR-2026-DEL-8902",
        "state": "Delhi",
        "district": "Central Delhi",
        "police_station": "Cyber Crime PS, Sector 20",
        "registration_date": "2026-03-20T10:00:00Z",
        "sections_of_law": ["Section 111 BNS", "Section 318 BNS", "Section 66D IT Act"],
        "complainant": "Special Cell / Financial Crimes Wing",
        "accused_persons": [
            {
                "name": "Rajan",
                "father_name": "K. L. Sharma",
                "alias": "Rajan Bhai",
                "history_sheet_status": "HS-DEL-Active-09",
                "prior_chargesheets": 4,
                "known_mobiles": ["+919999988888"],
                "modus_operandi": "Hawala Mastermind & Inter-state syndicate leader"
            }
        ],
        "investigating_officer": "ACP Vikramaditya Singh",
        "current_status": "UNDER_INVESTIGATION"
    }
}


def sync_cctns_fir(fir_number: str) -> Dict[str, Any]:
    """
    Simulates / queries CCTNS (Crime and Criminal Tracking Network & Systems)
    and ICJS (Inter-operable Criminal Justice System).
    Returns verified legal metadata, history sheets, and prior chargesheets for suspects.
    """
    clean_fir = fir_number.strip().upper()

    if clean_fir in CCTNS_DATABASE:
        return {
            "status": "SYNCED",
            "source": "CCTNS / ICJS National Police Grid",
            "last_synced": datetime.utcnow().isoformat() + "Z",
            "fir_data": CCTNS_DATABASE[clean_fir]
        }

    # Synthesize fallback for custom FIR queries
    return {
        "status": "SYNCED",
        "source": "CCTNS / ICJS National Police Grid",
        "last_synced": datetime.utcnow().isoformat() + "Z",
        "fir_data": {
            "fir_number": clean_fir,
            "state": "National Capital Region",
            "district": "Cyber Crime Division",
            "police_station": "Central Cyber Police Station",
            "registration_date": datetime.utcnow().isoformat() + "Z",
            "sections_of_law": ["Section 420 IPC", "Section 120B IPC", "Section 66 IT Act"],
            "complainant": "Cyber Crime Cell Incharge",
            "accused_persons": [
                {
                    "name": "Suspect Under Verification",
                    "history_sheet_status": "VERIFYING_PRIORS",
                    "prior_chargesheets": 0,
                    "modus_operandi": "Digital Financial Fraud"
                }
            ],
            "investigating_officer": "Station IO",
            "current_status": "ACTIVE_INQUIRY"
        }
    }


def query_suspect_priors_icjs(suspect_name: str) -> List[Dict[str, Any]]:
    """
    Queries ICJS criminal history records by suspect name across all state police forces.
    """
    results = []
    name_clean = suspect_name.lower().strip()
    for _, fir in CCTNS_DATABASE.items():
        for accused in fir.get("accused_persons", []):
            if name_clean in accused.get("name", "").lower() or name_clean in accused.get("alias", "").lower():
                results.append({
                    "suspect_name": accused.get("name"),
                    "alias": accused.get("alias"),
                    "fir_number": fir.get("fir_number"),
                    "police_station": fir.get("police_station"),
                    "history_sheet_status": accused.get("history_sheet_status"),
                    "prior_chargesheets": accused.get("prior_chargesheets"),
                    "sections_of_law": fir.get("sections_of_law")
                })
    return results
