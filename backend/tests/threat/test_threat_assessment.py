import pytest
from app.services.threat_assessment import ThreatAssessmentEngine, get_threat_engine
from app.api.threat_assessment import threat_assessment_health, assess_threat, get_framework_metadata, ThreatAssessmentRequest

def test_threat_assessment_happy_path_critical():
    """Happy Path: Evaluates an individual with multiple proximal warning behaviors (Pathway, Leakage, Direct Threat)."""
    engine = get_threat_engine()
    res = engine.evaluate_threat(
        subject_id="SUBJ-RADICAL-01",
        subject_name="Lone Actor Threat",
        active_proximal_ids=["PROX_01", "PROX_02", "PROX_06", "PROX_08"],
        active_distal_ids=["DIST_01", "DIST_02", "DIST_09"]
    )
    assert res["threat_index"] > 40.0
    assert res["priority_tier"] in ["LEVEL_1_IMMINENT_CRITICAL", "LEVEL_2_ELEVATED_RISK"]
    assert res["proximal_behaviors_count"] == 4
    assert len(res["proximal_matches"]) == 4

def test_threat_assessment_benign_edge_case():
    """Edge Case: Individual with zero proximal behaviors and low distal score."""
    engine = ThreatAssessmentEngine()
    res = engine.evaluate_threat(
        subject_id="SUBJ-BENIGN",
        subject_name="Civilian Dispute",
        active_proximal_ids=[],
        active_distal_ids=["DIST_01"]
    )
    assert res["threat_index"] < 20.0
    assert res["priority_tier"] == "LEVEL_3_BASELINE_MONITORING"
    assert res["proximal_behaviors_count"] == 0

def test_threat_api_endpoints():
    """API Validation: Health check, metadata schema, and POST assessment."""
    health = threat_assessment_health()
    assert health["status"] == "healthy"
    
    meta = get_framework_metadata()
    assert len(meta["proximal_warning_behaviors"]) == 8
    assert len(meta["distal_characteristics"]) == 10
    
    req = ThreatAssessmentRequest(
        subject_id="S-1",
        subject_name="Test Subject",
        active_proximal_ids=["PROX_01"],
        active_distal_ids=[]
    )
    eval_res = assess_threat(req)
    assert eval_res["subject_id"] == "S-1"
