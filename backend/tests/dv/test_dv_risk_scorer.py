import pytest
from app.ml_service.dv_risk_scorer import DVRiskScorer, get_dv_risk_scorer
from app.api.dv_risk import dv_health, get_da_questions, assess_dv_risk, DVAssessmentRequest

def test_dv_risk_scorer_happy_path_extreme_lethality():
    """Happy Path: Checks an assessment with strangulation, firearm, and death threats."""
    scorer = get_dv_risk_scorer()
    res = scorer.score_assessment(
        case_id="DV-CASE-01",
        victim_alias="Victim P",
        affirmed_question_ids=["DA_01", "DA_02", "DA_03", "DA_04", "DA_05", "DA_09"],
        children_involved=True
    )
    assert res["lethality_score"] > 60.0
    assert res["risk_tier"] == "EXTREME_LETHALITY_RISK"
    assert res["strangulation_flag"] is True
    assert res["weapon_access_flag"] is True
    assert "Section 18" in res["statutory_relief"]

def test_dv_risk_scorer_minimal_risk_edge_case():
    """Edge Case: Zero affirmed questions results in baseline risk."""
    scorer = DVRiskScorer()
    res = scorer.score_assessment(
        case_id="DV-CASE-LOW",
        victim_alias="Victim L",
        affirmed_question_ids=[],
        children_involved=False
    )
    assert res["lethality_score"] == 0.0
    assert res["risk_tier"] == "BASELINE_RISK"
    assert res["strangulation_flag"] is False

def test_dv_risk_api_endpoints():
    """API Validation: Checks health endpoint, questions list, and POST assess endpoint."""
    health = dv_health()
    assert health["status"] == "healthy"
    
    questions = get_da_questions()
    assert len(questions) == 10
    
    req = DVAssessmentRequest(
        case_id="DV-API-1",
        victim_alias="Alias V",
        affirmed_question_ids=["DA_03"] # Strangulation
    )
    res = assess_dv_risk(req)
    assert res["strangulation_flag"] is True
    assert res["risk_tier"] in ["HIGH_LETHALITY_RISK", "EXTREME_LETHALITY_RISK"]
