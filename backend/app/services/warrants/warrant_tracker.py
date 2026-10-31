"""
Multi-Jurisdiction Warrant & Look Out Circular (LOC) Tracker for CRIMENEXUS.

Enforces cross-state fugitive tracking, Section 84/85 BNSS (Proclaimed Offender),
and Bureau of Immigration (BOI) border control synchronization.
"""

import uuid
import datetime
from typing import Dict, Any, List, Optional
from enum import Enum


class WarrantType(str, Enum):
    BAILABLE = "BAILABLE"
    NON_BAILABLE = "NON_BAILABLE"
    PROCLAIMED_OFFENDER = "PROCLAIMED_OFFENDER"
    LOOK_OUT_CIRCULAR = "LOOK_OUT_CIRCULAR"


class WarrantStatus(str, Enum):
    ACTIVE = "ACTIVE"
    EXECUTED = "EXECUTED"
    EXPIRED = "EXPIRED"
    RECALLED = "RECALLED"


# In-memory registry / database sync store
_WARRANT_STORE: Dict[str, Dict[str, Any]] = {}


def register_warrant(warrant_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Registers a court warrant or immigration LOC.
    """
    w_id = warrant_data.get("warrant_id") or f"WRT-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.datetime.utcnow().isoformat()
    
    # Calculate expiry if not provided (default 1 year for LOC, 180 days for NBW)
    w_type = warrant_data.get("warrant_type", WarrantType.NON_BAILABLE.value)
    if "expiry_date" not in warrant_data:
        days = 365 if w_type == WarrantType.LOOK_OUT_CIRCULAR.value else 180
        exp_dt = datetime.datetime.utcnow() + datetime.timedelta(days=days)
        expiry_date = exp_dt.isoformat()
    else:
        expiry_date = warrant_data["expiry_date"]

    record = {
        "warrant_id": w_id,
        "case_id": warrant_data.get("case_id", "UNKNOWN"),
        "suspect_name": warrant_data.get("suspect_name", "").strip(),
        "alias": warrant_data.get("alias", ""),
        "warrant_type": w_type,
        "issuing_court": warrant_data.get("issuing_court", "Chief Judicial Magistrate"),
        "issuing_state": warrant_data.get("issuing_state", "DELHI").upper(),
        "issuing_station": warrant_data.get("issuing_station", "PS_CENTRAL"),
        "status": WarrantStatus.ACTIVE.value,
        "priority": warrant_data.get("priority", "HIGH"),
        "border_control_flag": warrant_data.get("border_control_flag", w_type == WarrantType.LOOK_OUT_CIRCULAR.value),
        "created_at": now_iso,
        "expiry_date": expiry_date,
        "execution_details": None
    }
    
    _WARRANT_STORE[w_id] = record
    return record


def search_warrants(
    query: str,
    state: Optional[str] = None,
    border_control_only: bool = False
) -> List[Dict[str, Any]]:
    """
    Searches active warrants across state jurisdictions by suspect name, alias, or case ID.
    """
    q = query.lower().strip()
    results = []
    
    for r in _WARRANT_STORE.values():
        if r["status"] != WarrantStatus.ACTIVE.value:
            continue
            
        if border_control_only and not r["border_control_flag"]:
            continue
            
        if state and r["issuing_state"] != state.upper():
            continue
            
        name_match = q in r["suspect_name"].lower()
        alias_match = q in r.get("alias", "").lower()
        case_match = q in r["case_id"].lower()
        id_match = q in r["warrant_id"].lower()
        
        if name_match or alias_match or case_match or id_match:
            results.append(r)
            
    return results


def execute_warrant(
    warrant_id: str,
    executing_officer: str,
    executing_station: str,
    notes: str
) -> Dict[str, Any]:
    """
    Marks a warrant as EXECUTED with officer audit details.
    """
    if warrant_id not in _WARRANT_STORE:
        raise ValueError(f"Warrant {warrant_id} not found in national registry.")
        
    rec = _WARRANT_STORE[warrant_id]
    rec["status"] = WarrantStatus.EXECUTED.value
    rec["execution_details"] = {
        "executed_at": datetime.datetime.utcnow().isoformat(),
        "executing_officer": executing_officer,
        "executing_station": executing_station,
        "notes": notes
    }
    return rec


def get_expiring_locs(days_threshold: int = 15) -> List[Dict[str, Any]]:
    """
    Returns active LOCs expiring within specified days so police can petition for renewal.
    """
    now = datetime.datetime.utcnow()
    expiring = []
    
    for r in _WARRANT_STORE.values():
        if r["status"] == WarrantStatus.ACTIVE.value and r["warrant_type"] == WarrantType.LOOK_OUT_CIRCULAR.value:
            try:
                exp_dt = datetime.datetime.fromisoformat(r["expiry_date"])
                days_left = (exp_dt - now).total_seconds() / 86400.0
                if 0 <= days_left <= days_threshold:
                    expiring.append({**r, "days_until_expiry": round(days_left, 1)})
            except Exception:
                continue
                
    return expiring


def clear_warrant_store_for_tests():
    _WARRANT_STORE.clear()
