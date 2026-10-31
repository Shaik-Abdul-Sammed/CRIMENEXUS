"""
Automated Case Aging & Stalled Investigation Alert Engine for CRIMENEXUS.

Monitors investigation velocity and enforces statutory compliance under:
- Section 193 Bharatiya Nagarik Suraksha Sanhita (BNSS) / Section 173 CrPC.
- POCSO Act 60-day investigation mandate.
- Identifies inactive cases ("cold trail" or unattended case diaries) to prevent
  evidence spoliation and unlawful detention.
"""

import datetime
from typing import Dict, Any, List, Optional
from enum import Enum


class AgingSeverity(str, Enum):
    ON_TRACK = "ON_TRACK"
    STALLED_LOW = "STALLED_LOW"
    STALLED_MEDIUM = "STALLED_MEDIUM"
    STATUTORY_BREACH_CRITICAL = "STATUTORY_BREACH_CRITICAL"


def analyze_case_aging(
    case_record: Dict[str, Any],
    reference_date: Optional[datetime.datetime] = None
) -> Dict[str, Any]:
    """
    Evaluates aging and activity velocity for an individual case record.
    """
    now = reference_date or datetime.datetime.utcnow()
    
    # Parse dates
    created_at_str = case_record.get("created_at") or case_record.get("registered_at")
    last_activity_str = case_record.get("last_activity_at") or created_at_str
    
    try:
        created_at = datetime.datetime.fromisoformat(created_at_str)
    except Exception:
        created_at = now
        
    try:
        last_activity = datetime.datetime.fromisoformat(last_activity_str)
    except Exception:
        last_activity = created_at

    case_age_days = max(0, int((now - created_at).total_seconds() / 86400.0))
    inactivity_days = max(0, int((now - last_activity).total_seconds() / 86400.0))
    
    status = case_record.get("status", "INVESTIGATION_OPEN").upper()
    offense_type = case_record.get("offense_type", "GENERAL").upper()
    has_charge_sheet = case_record.get("has_charge_sheet", False)

    # Statutory threshold check (BNSS Sec 193)
    max_statutory_days = 60 if ("POCSO" in offense_type or "RAPE" in offense_type) else 90

    severity = AgingSeverity.ON_TRACK
    alert_message = "Investigation progressing within normal timeline."
    action_required = "None"

    if not has_charge_sheet and status in ["INVESTIGATION_OPEN", "PENDING"]:
        if case_age_days >= max_statutory_days:
            severity = AgingSeverity.STATUTORY_BREACH_CRITICAL
            alert_message = (
                f"Statutory limit of {max_statutory_days} days exceeded under BNSS Sec 193. "
                f"Case aged {case_age_days} days without charge-sheet submission."
            )
            action_required = "Immediate SP intervention; file Section 193 extension or final report."
        elif inactivity_days >= 30:
            severity = AgingSeverity.STALLED_MEDIUM
            alert_message = f"Zero case diary entries or evidence logged in past {inactivity_days} days."
            action_required = "Issue supervisory memorandum to IO; inspect Case Diary Vol II."
        elif case_age_days >= 60:
            severity = AgingSeverity.STALLED_LOW
            alert_message = f"Case aged {case_age_days} days. 30 days remaining before statutory deadline."
            action_required = "Review pending FSL/forensic reports and expedite chargesheet draft."

    return {
        "case_id": case_record.get("case_id", "UNKNOWN"),
        "case_age_days": case_age_days,
        "inactivity_days": inactivity_days,
        "statutory_limit_days": max_statutory_days,
        "severity": severity.value,
        "alert_message": alert_message,
        "action_required": action_required,
        "is_stalled": severity in [AgingSeverity.STALLED_MEDIUM, AgingSeverity.STATUTORY_BREACH_CRITICAL]
    }


def aggregate_station_case_aging(
    cases: List[Dict[str, Any]],
    reference_date: Optional[datetime.datetime] = None
) -> Dict[str, Any]:
    """
    Aggregates aging metrics across an entire police station or sub-division.
    """
    analyzed = [analyze_case_aging(c, reference_date) for c in cases]
    
    buckets = {
        "under_30_days": 0,
        "30_to_60_days": 0,
        "60_to_90_days": 0,
        "over_90_days_critical": 0
    }
    
    stalled_count = 0
    critical_count = 0
    
    for item in analyzed:
        age = item["case_age_days"]
        if age < 30:
            buckets["under_30_days"] += 1
        elif age < 60:
            buckets["30_to_60_days"] += 1
        elif age < 90:
            buckets["60_to_90_days"] += 1
        else:
            buckets["over_90_days_critical"] += 1
            
        if item["is_stalled"]:
            stalled_count += 1
        if item["severity"] == AgingSeverity.STATUTORY_BREACH_CRITICAL.value:
            critical_count += 1

    return {
        "total_cases_analyzed": len(cases),
        "aging_buckets": buckets,
        "stalled_cases_count": stalled_count,
        "critical_statutory_breaches": critical_count,
        "case_details": analyzed
    }
