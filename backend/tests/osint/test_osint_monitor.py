import pytest
from app.services.external.osint_monitor import OSINTMonitorService, get_osint_service
from app.api.osint_monitor import osint_health, get_osint_alerts, scan_osint_text, OSINTScanRequest

def test_osint_service_happy_path():
    """Happy Path: Retrieves OSINT alerts and verifies weapon and breach alerts."""
    service = get_osint_service()
    alerts = service.get_latest_alerts(min_threat_score=60.0)
    assert len(alerts) >= 2
    assert any("pistols" in a["keywords_detected"] for a in alerts)
    assert any("Aadhaar" in a["keywords_detected"] for a in alerts)

def test_osint_scan_custom_text():
    """Action Path: Scans a threatening post mentioning arms and blasts."""
    service = get_osint_service()
    res = service.scan_custom_text("Selling illegal Glock and ammunition for extortion gang")
    assert res["threat_score"] > 50.0
    assert "glock" in res["threat_keywords_detected"]
    assert res["status"] == "FLAGGED_FOR_HUMAN_TRIAGE"

def test_osint_api_endpoints():
    """API Validation: Checks health endpoint and scanner endpoint."""
    health = osint_health()
    assert health["status"] == "healthy"
    
    req = OSINTScanRequest(raw_text="Normal business invoice with benign details")
    res = scan_osint_text(req)
    assert res["threat_score"] == 0.0
    assert res["status"] == "BENIGN"
