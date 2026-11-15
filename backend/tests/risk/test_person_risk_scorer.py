import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ml_service.person_risk_scorer import PersonRiskScorer

client = TestClient(app)

def test_person_risk_scorer_happy_path():
    """Test Feature 2: Person risk score falls within 0-100 and SHAP values sum to the score."""
    result = PersonRiskScorer.calculate_risk("PERSON-VK-01")
    assert 0 <= result["risk_score"] <= 100
    assert result["risk_tier"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    
    # SHAP mathematical validation
    shap = result["shap_breakdown"]
    total_shap = shap["sum_of_shap_values"]
    assert abs(total_shap - result["risk_score"]) < 0.2, (
        f"SHAP sum {total_shap} must equal score {result['risk_score']}"
    )

def test_person_risk_scorer_civilian_low_risk():
    """Test Feature 2 Edge Case: Civilian with 0 FIRs and low centrality has low risk score."""
    result = PersonRiskScorer.calculate_risk("PERSON-PS-03")
    assert result["risk_score"] < 35
    assert result["risk_tier"] == "LOW"

def test_person_risk_api_endpoint():
    """Test Feature 2 API: Endpoint /api/v1/risk-scoring/person/{id} and health respond 200."""
    health_resp = client.get("/api/v1/risk-scoring/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"

    resp = client.get("/api/v1/risk-scoring/person/PERSON-VK-01")
    assert resp.status_code == 200
    data = resp.json()
    assert data["person_id"] == "PERSON-VK-01"
    assert "shap_breakdown" in data
