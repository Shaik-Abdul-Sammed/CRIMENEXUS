import pytest
from app.services.analytics.workload_balancer import (
    calculate_officer_workloads,
    recommend_io_for_new_case,
    compute_case_weight,
    SEVERITY_WEIGHTS
)

def test_compute_case_weight_heinous_vs_minor():
    assert compute_case_weight({"category": "MURDER"}) == 5
    assert compute_case_weight({"category": "POCSO ACT SEC 4"}) == 5
    assert compute_case_weight({"category": "ARMED ROBBERY"}) == 3
    assert compute_case_weight({"category": "CYBER FRAUD"}) == 2
    assert compute_case_weight({"category": "PETTY THEFT"}) == 1


def test_workload_balancer_identifies_overloaded_io():
    officers = [
        {
            "officer_id": "IO_01",
            "name": "SI Sharma",
            "active_cases": [
                {"category": "MURDER", "has_active_custody": True},   # 5 + 2 = 7
                {"category": "MURDER", "has_active_custody": True},   # 5 + 2 = 7
                {"category": "ROBBERY", "has_active_custody": False}, # 3
                {"category": "CYBER FRAUD", "has_active_custody": False}, # 2
                {"category": "CYBER FRAUD", "has_active_custody": False}, # 2
            ] # Total: 21 points
        },
        {
            "officer_id": "IO_02",
            "name": "SI Verma",
            "active_cases": [
                {"category": "PETTY THEFT"}, # 1
                {"category": "CHEATING"},    # 2
            ] # Total: 3 points
        },
        {
            "officer_id": "IO_03",
            "name": "SI Singh",
            "active_cases": [
                {"category": "THEFT"}, # 1
                {"category": "THEFT"}, # 1
            ] # Total: 2 points
        }
    ]
    
    summary = calculate_officer_workloads(officers)
    # Median of [21, 3, 2] is 3. Overload threshold max(5, 3*1.5) = 5.
    # IO_01 has 21 > 5 -> Overloaded
    assert summary["overloaded_count"] == 1
    overloaded_io = next(o for o in summary["officers"] if o["officer_id"] == "IO_01")
    assert overloaded_io["is_overloaded"] is True
    assert overloaded_io["workload_score"] == 21

    # IO_03 has 2 <= 5 -> Not overloaded
    underloaded_io = next(o for o in summary["officers"] if o["officer_id"] == "IO_03")
    assert underloaded_io["is_overloaded"] is False


def test_recommend_io_for_incoming_fir():
    officers = [
        {"officer_id": "IO_HEAVY", "name": "Inspector Heavy", "active_cases": [{"category": "MURDER"}] * 4}, # 20 pts
        {"officer_id": "IO_LIGHT", "name": "Sub-Inspector Light", "active_cases": [{"category": "THEFT"}]},   # 1 pt
    ]
    rec = recommend_io_for_new_case(officers, case_category="MURDER")
    assert rec["recommended_officer_id"] == "IO_LIGHT"
    assert rec["current_workload_score"] == 1
    assert rec["projected_workload_score"] == 6
