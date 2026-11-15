import pytest
from app.ml_service.sar_analyzer import SARAnalyzer, get_sar_analyzer
from app.api.sar_analytics import sar_health, get_sar_benchmarks, analyze_suspicious_activity, SARAnalysisRequest, TransactionItem

def test_sar_analyzer_happy_path_structuring_and_layering():
    """Happy Path: Flags transactions just under PAN limit (₹48,000) and rapid mule velocity (< 15 mins)."""
    analyzer = get_sar_analyzer()
    transactions = [
        {"id": "TX-1", "amount": 48500.0, "velocity_minutes": 5},
        {"id": "TX-2", "amount": 49200.0, "velocity_minutes": 8},
        {"id": "TX-3", "amount": 950000.0, "velocity_minutes": 60}
    ]
    res = analyzer.analyze_transactions(transactions)
    assert res["structuring_detected"] is True
    assert res["mule_layering_detected"] is True
    assert res["structuring_events_count"] == 3
    assert res["sar_score"] >= 60.0
    assert "PMLA 2002" in res["pmla_statutory_basis"]

def test_sar_analyzer_clean_transactions_edge_case():
    """Edge Case: Legitimate low-amount transactions should not trigger structuring or high SAR score."""
    analyzer = SARAnalyzer()
    transactions = [
        {"id": "TX-A", "amount": 1500.0, "velocity_minutes": 120},
        {"id": "TX-B", "amount": 5000.0, "velocity_minutes": 300}
    ]
    res = analyzer.analyze_transactions(transactions)
    assert res["structuring_detected"] is False
    assert res["mule_layering_detected"] is False
    assert res["sar_score"] < 25.0

def test_sar_api_endpoints():
    """API Validation: Checks health endpoint, benchmarks list, and POST analysis endpoint."""
    health = sar_health()
    assert health["status"] == "healthy"
    
    benchmarks = get_sar_benchmarks()
    assert len(benchmarks) >= 2
    
    req = SARAnalysisRequest(
        suspect_id="SUSP-MULE-88",
        entity_name="Apex Logistics Mule Front",
        transactions=[
            TransactionItem(id="T1", amount=49000.0, sender_account="ACC-1", receiver_account="ACC-2", velocity_minutes=4)
        ]
    )
    analysis = analyze_suspicious_activity(req)
    assert analysis["suspect_id"] == "SUSP-MULE-88"
    assert analysis["structuring_detected"] is True
