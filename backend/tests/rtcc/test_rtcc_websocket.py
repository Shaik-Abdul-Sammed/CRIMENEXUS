import pytest
from fastapi.testclient import TestClient
from app.api.rtcc import rtcc_health, rtcc_events_snapshot, rtcc_dispatch, RTCCDispatch

def test_rtcc_health_and_snapshot_happy_path():
    """Happy Path: Verifies RTCC health endpoint and snapshot data for all 4 panels."""
    health = rtcc_health()
    assert health["status"] == "healthy"
    assert "streams" in health
    assert len(health["streams"]) == 4

    snapshot = rtcc_events_snapshot()
    assert "alerts" in snapshot
    assert "anpr" in snapshot
    assert "cdr" in snapshot
    assert "markers" in snapshot
    assert len(snapshot["alerts"]) >= 1
    assert len(snapshot["anpr"]) >= 1

def test_rtcc_dispatch_action():
    """Action Path: Verifies dispatching a tactical unit from the RTCC console."""
    payload = RTCCDispatch(
        incident_id="ALT-901",
        unit_id="PCR-EAGLE-12",
        priority="CRITICAL",
        location="Connaught Place Inner Circle",
        instructions="Intercept armed suspect on foot"
    )
    res = rtcc_dispatch(payload)
    assert res["status"] == "DISPATCHED"
    assert res["unit_id"] == "PCR-EAGLE-12"
    assert "acknowledgement" in res

def test_rtcc_websocket_connection_and_initial_message():
    """WebSocket / Streaming: Tests connecting to RTCC websocket using TestClient."""
    from fastapi import FastAPI
    from app.api.rtcc import router
    app = FastAPI()
    app.include_router(router)
    
    client = TestClient(app)
    with client.websocket_connect("/ws/rtcc") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "INITIAL_SNAPSHOT"
        assert "alerts" in data["data"]
        assert "anpr" in data["data"]
