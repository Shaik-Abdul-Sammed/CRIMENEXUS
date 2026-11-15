import pytest
from app.services.external.interpol_adapter import InterpolAdapter, get_interpol_adapter
from app.api.interpol_sync import interpol_health, get_interpol_notices, query_interpol_notices, InterpolQueryRequest

def test_interpol_adapter_happy_path():
    """Happy Path: Queries Interpol Red Notices and verifies real fugitive return."""
    adapter = get_interpol_adapter()
    reds = adapter.query_notices(notice_type="RED_NOTICE")
    assert len(reds) >= 2
    assert any("Goldy Brar" in n["subject_name"] for n in reds)
    assert any("Anmol Bishnoi" in n["subject_name"] for n in reds)
    assert reds[0]["extradition_treaty_active"] is True

def test_interpol_adapter_filter_edge_case():
    """Edge Case: Query filtering by nationality or notice type."""
    adapter = InterpolAdapter()
    yellows = adapter.query_notices(notice_type="YELLOW_NOTICE")
    assert len(yellows) >= 1
    assert yellows[0]["notice_type"] == "YELLOW_NOTICE"
    
    empty_res = adapter.query_notices(query="NON-EXISTENT-FUGITIVE-XYZ-12345")
    assert len(empty_res) == 0

def test_interpol_api_endpoints():
    """API Endpoint: Health check and query endpoint validation."""
    health = interpol_health()
    assert health["status"] == "healthy"
    assert health["gateway_status"] == "NCB_NEW_DELHI_CONNECTED"
    
    req = InterpolQueryRequest(query="Goldy", notice_type="RED_NOTICE")
    res = query_interpol_notices(req)
    assert res["total_hits"] >= 1
    assert "Goldy" in res["results"][0]["subject_name"]
