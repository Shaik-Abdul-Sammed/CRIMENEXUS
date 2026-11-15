import pytest
from app.ml_service.case_triage import CaseTriageEngine, get_case_triage_engine
from app.api.case_triage import triage_health, get_triage_queue, evaluate_case_triage, CaseTriageRequest

def test_case_triage_happy_path_high_solvability():
    """Happy Path: Evaluates a fresh case (< 4 hours) with named suspect, vehicle plate, and CCTV."""
    engine = get_case_triage_engine()
    res = engine.evaluate_case(
        case_id="CASE-TEST-01",
        offense_category="Armed Robbery",
        present_factors=["named_suspect", "vehicle_license_plate", "cctv_footage_available"],
        hours_since_occurrence=2.0
    )
    assert res["solvability_score"] > 55.0
    assert "IMMEDIATE" in res["priority_tier"]
    assert res["factors_present_count"] == 3
    assert "BNSS" in res["statutory_mandate"]

def test_case_triage_cold_case_decay_edge_case():
    """Edge Case: Case occurred 120 hours ago with zero leads yields low solvability score."""
    engine = CaseTriageEngine()
    res = engine.evaluate_case(
        case_id="CASE-COLD",
        offense_category="Petty Theft",
        present_factors=[],
        hours_since_occurrence=120.0
    )
    assert res["solvability_score"] == 0.0
    assert "STANDARD" in res["priority_tier"]

def test_case_triage_api_endpoints():
    """API Validation: Checks health endpoint, queue retrieval, and POST triage evaluation."""
    health = triage_health()
    assert health["status"] == "healthy"
    
    queue = get_triage_queue()
    assert len(queue) >= 3
    assert queue[0]["priority_tier"] == "IMMEDIATE_DISPATCH (TIER 1)"
    
    req = CaseTriageRequest(
        case_id="FIR-API-TEST",
        offense_category="Burglary",
        present_factors=["vehicle_license_plate", "cooperative_eyewitness"],
        hours_since_occurrence=5.0
    )
    eval_res = evaluate_case_triage(req)
    assert eval_res["case_id"] == "FIR-API-TEST"
    assert eval_res["solvability_score"] > 20.0
