import pytest
from app.services.forensics.fir_intelligence_engine import fir_intelligence_engine

class MockFIR:
    def __init__(self, case_number, year, crime_type, outcome):
        self.case_number = case_number
        self.year = year
        self.crime_type = crime_type
        self.case_outcome = outcome

@pytest.fixture
def mock_200_firs():
    firs = []
    for i in range(200):
        firs.append(MockFIR(
            case_number=f"FIR-{2015 + (i % 11)}-TEST-{100 + i}",
            year=2015 + (i % 11),
            crime_type="Organized Extortion" if i % 2 == 0 else "Financial Fraud",
            outcome="CONVICTED" if i % 3 == 0 else "PENDING"
        ))
    return firs

def test_all_25_analytics_return_non_empty(mock_200_firs):
    results = fir_intelligence_engine.run_all_25_analytics(mock_200_firs)
    assert len(results) == 25, f"Expected 25 analytical results, got {len(results)}"

    for r in results:
        assert "analytics_id" in r
        assert "name" in r
        assert "result" in r
        assert len(r["result"]) > 10
        
        # Verify confidence field is in [0.0, 1.0]
        assert "confidence" in r
        assert isinstance(r["confidence"], (float, int))
        assert 0.0 <= r["confidence"] <= 1.0, f"Confidence {r['confidence']} outside [0.0, 1.0] in {r['analytics_id']}"
        
        # Verify evidence_firs array
        assert "evidence_firs" in r
        assert isinstance(r["evidence_firs"], list)
        assert len(r["evidence_firs"]) > 0, f"No evidence FIRs returned in {r['analytics_id']}"
        
        # Verify explanation & recommendation
        assert "explanation" in r
        assert "recommendation" in r

def test_single_analytic_retrieval(mock_200_firs):
    insight = fir_intelligence_engine.get_single_analytic("FIA-003", mock_200_firs)
    assert insight is not None
    assert insight["analytics_id"] == "FIA-003"
    assert "Linguistic Fingerprint" in insight["name"]
