"""
Officer Workload Balancer for CRIMENEXUS.

Calculates weighted investigative load per officer based on case severity,
active remands, and statutory countdown pressure to eliminate IO burnout
and ensure prompt charge-sheet submission.
"""

from typing import Dict, Any, List
import statistics


SEVERITY_WEIGHTS = {
    "HEINOUS": 5,        # Homicide, Gang-rape, POCSO, Terrorism
    "SERIOUS": 3,        # Extortion, Armed Robbery, Kidnapping
    "ECONOMIC": 2,       # Cyber fraud, Embezzlement, Forgery
    "MINOR": 1           # Petty theft, Simple Hurt, Traffic/MVA
}


def compute_case_weight(case: Dict[str, Any]) -> int:
    category = case.get("category", "").upper()
    if any(k in category for k in ["MURDER", "HOMICIDE", "RAPE", "POCSO", "TERROR"]):
        return SEVERITY_WEIGHTS["HEINOUS"]
    elif any(k in category for k in ["ROBBERY", "EXTORTION", "KIDNAP"]):
        return SEVERITY_WEIGHTS["SERIOUS"]
    elif any(k in category for k in ["CYBER", "FRAUD", "CHEATING", "FORGERY", "UPI"]):
        return SEVERITY_WEIGHTS["ECONOMIC"]
    return SEVERITY_WEIGHTS["MINOR"]


def calculate_officer_workloads(officers: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes workload distribution across all officers in a police station.
    """
    if not officers:
        return {"median_workload": 0.0, "officers": [], "overloaded_officers": []}

    scored_officers = []
    scores = []

    for off in officers:
        cases = off.get("active_cases", [])
        total_weight = sum(compute_case_weight(c) for c in cases)
        remand_urgency_count = sum(1 for c in cases if c.get("has_active_custody", False))
        
        # Urgency multiplier for active remand cases (< 24/48h)
        adjusted_score = total_weight + (remand_urgency_count * 2)

        scored_officers.append({
            "officer_id": off["officer_id"],
            "name": off.get("name", "Unknown IO"),
            "rank": off.get("rank", "Sub-Inspector"),
            "case_count": len(cases),
            "workload_score": adjusted_score,
            "remand_cases": remand_urgency_count
        })
        scores.append(adjusted_score)

    median_score = statistics.median(scores) if scores else 0.0
    overload_threshold = max(5.0, median_score * 1.5)

    overloaded = []
    for so in scored_officers:
        if so["workload_score"] > overload_threshold:
            so["is_overloaded"] = True
            overloaded.append(so["officer_id"])
        else:
            so["is_overloaded"] = False

    return {
        "station_median_workload": round(median_score, 1),
        "overload_threshold": round(overload_threshold, 1),
        "total_officers": len(officers),
        "overloaded_count": len(overloaded),
        "officers": scored_officers
    }


def recommend_io_for_new_case(
    officers: List[Dict[str, Any]],
    case_category: str = "ECONOMIC"
) -> Dict[str, Any]:
    """
    Recommends the best available IO for a new FIR based on lowest active workload score.
    """
    workloads = calculate_officer_workloads(officers)
    if not workloads["officers"]:
        raise ValueError("No active investigating officers available in station roster.")

    # Sort ascending by workload_score
    sorted_ios = sorted(workloads["officers"], key=lambda x: x["workload_score"])
    recommended = sorted_ios[0]

    incoming_weight = compute_case_weight({"category": case_category})

    return {
        "recommended_officer_id": recommended["officer_id"],
        "recommended_officer_name": recommended["name"],
        "current_workload_score": recommended["workload_score"],
        "projected_workload_score": recommended["workload_score"] + incoming_weight,
        "recommendation_reason": (
            f"Officer {recommended['name']} has lowest active investigative burden "
            f"({recommended['workload_score']} points vs station median {workloads['station_median_workload']})."
        )
    }
