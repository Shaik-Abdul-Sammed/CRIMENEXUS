import pytest
from app.api.imsi_catcher import imsi_catcher_health, get_imsi_sessions, authorize_imsi_session, purge_expired_sessions, CreateIMSISessionRequest

def test_imsi_catcher_happy_path():
    """Happy Path: Authorizes a cell-site simulator deployment with valid dual-custody warrant."""
    health = imsi_catcher_health()
    assert health["status"] == "healthy"
    assert "Dual-Custody Warrant Check" in health["safeguards"]
    
    req = CreateIMSISessionRequest(
        operation_name="Operation Test Intercept",
        target_imsi="404450991827364",
        warrant_number="WAR-DEL-2026-99",
        approving_authority="Principal Secretary Home",
        location_polygon="Polygon((28.6 77.2, 28.7 77.2, 28.7 77.3, 28.6 77.2))",
        authorized_duration_hours=72
    )
    sess = authorize_imsi_session(req)
    assert sess["status"] == "ACTIVE_AUTHORIZED"
    assert len(sess["audit_hash"]) == 64
    assert sess["hours_remaining"] == 72.0

def test_imsi_purge_expired_sessions():
    """Action Path: Checks automated purge mechanism for sessions exceeding duration."""
    res = purge_expired_sessions()
    assert res["status"] == "SUCCESS"
    assert "purged_sessions_count" in res

def test_imsi_sessions_roster_integrity():
    """Validation: Checks roster returns masked bystanders and statutory basis."""
    sessions = get_imsi_sessions()
    assert sessions["total_deployments"] >= 2
    for s in sessions["sessions"]:
        assert s["bystanders_masked_count"] <= s["total_handsets_detected"]
        assert "audit_hash" in s
