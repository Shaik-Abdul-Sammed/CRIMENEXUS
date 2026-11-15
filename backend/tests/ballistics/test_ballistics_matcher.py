import pytest
from app.ml_service.ballistics_matcher import BallisticsMatcher, get_ballistics_matcher
from app.api.ibis import ibis_health, get_ibis_specimens, match_ballistics, BallisticsMatchRequest

def test_ballistics_matcher_happy_path():
    """Happy Path: Queries a 9mm casing and matches a candidate with near-identical striation pitch (high correlation score)."""
    matcher = get_ballistics_matcher()
    query = {
        "specimen_id": "TEST-Q1",
        "caliber": "9mm parabellum",
        "rifling_lands": 6,
        "twist_direction": "RIGHT",
        "striation_pitch_mm": 0.125
    }
    candidates = [
        {
            "specimen_id": "CAND-01",
            "caliber": "9mm parabellum",
            "rifling_lands": 6,
            "twist_direction": "RIGHT",
            "striation_pitch_mm": 0.126 # Difference = 0.001mm
        }
    ]
    res = matcher.compute_striation_correlation(query, candidates)
    assert len(res) == 1
    assert res[0]["correlation_score"] > 95.0
    assert res[0]["confidence_tier"] == "CONCLUSIVE_IDENTIFICATION"
    assert res[0]["breech_face_match"] is True

def test_ballistics_class_characteristic_mismatch_edge_case():
    """Edge Case: Differing caliber or twist direction results in exclusion (0 matches returned)."""
    matcher = BallisticsMatcher()
    query = {
        "specimen_id": "TEST-MISMATCH",
        "caliber": "9mm",
        "rifling_lands": 6,
        "twist_direction": "RIGHT"
    }
    candidates = [
        {
            "specimen_id": "CAND-DIFF",
            "caliber": ".32 acp", # Different caliber
            "rifling_lands": 6,
            "twist_direction": "LEFT"
        }
    ]
    res = matcher.compute_striation_correlation(query, candidates)
    assert len(res) == 0

def test_ibis_api_endpoints():
    """API Validation: Checks health endpoint, specimens list, and POST match endpoint."""
    health = ibis_health()
    assert health["status"] == "healthy"
    
    specimens = get_ibis_specimens()
    assert len(specimens) >= 2
    
    req = BallisticsMatchRequest(
        specimen_id="QRY-001",
        caliber="9mm parabellum",
        rifling_lands=6,
        twist_direction="RIGHT",
        striation_pitch_mm=0.125
    )
    match_res = match_ballistics(req)
    assert match_res["matches_found"] >= 1
    assert match_res["results"][0]["status"] == "BALLISTICS_HIT"
