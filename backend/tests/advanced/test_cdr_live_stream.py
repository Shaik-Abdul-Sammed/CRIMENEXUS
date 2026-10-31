import pytest
from app.services.streaming.telecom_gateway import (
    register_target_watch,
    ingest_live_cdr_packet,
    get_live_cdr_trail,
    clear_telecom_gateway_for_tests
)

@pytest.fixture(autouse=True)
def reset_telecom():
    clear_telecom_gateway_for_tests()


def test_normal_cdr_packet_ingestion():
    packet = {
        "caller": "+919811122233",
        "callee": "+919844455566",
        "call_type": "VOICE",
        "tower_id": "TWR-DELHI-CP-04",
        "latitude": 28.6304,
        "longitude": 77.2177,
        "duration_sec": 45,
        "timestamp": "2026-03-01T10:15:00"
    }
    res = ingest_live_cdr_packet(packet)
    assert res["status"] == "INGESTED"
    assert res["is_target_hit"] is False
    assert res["alert"] is None


def test_target_watchlist_triggers_critical_alert():
    target_phone = "+919988776655"
    register_target_watch(target_phone, case_id="KIDNAP-2026-09", priority="CRITICAL")
    
    packet = {
        "caller": target_phone,
        "callee": "+919111223344",
        "call_type": "VOICE",
        "tower_id": "TWR-NOIDA-SEC62",
        "latitude": 28.6280,
        "longitude": 77.3649,
        "duration_sec": 12,
        "timestamp": "2026-03-01T11:00:00"
    }
    
    res = ingest_live_cdr_packet(packet)
    assert res["status"] == "INGESTED"
    assert res["is_target_hit"] is True
    assert res["alert"] is not None
    assert res["alert"]["case_id"] == "KIDNAP-2026-09"
    assert res["alert"]["priority"] == "CRITICAL"
    assert "TWR-NOIDA-SEC62" in res["alert"]["dispatch_instruction"]


def test_live_cdr_trail_tracking():
    phone = "+919876543210"
    
    # Ingest 3 packets representing suspect movement
    ingest_live_cdr_packet({
        "caller": phone,
        "callee": "+919000000001",
        "tower_id": "TOWER-A",
        "timestamp": "2026-03-01T10:00:00"
    })
    ingest_live_cdr_packet({
        "caller": phone,
        "callee": "+919000000002",
        "tower_id": "TOWER-B",
        "timestamp": "2026-03-01T10:30:00"
    })
    ingest_live_cdr_packet({
        "caller": "+919000000003",
        "callee": phone,
        "tower_id": "TOWER-C",
        "timestamp": "2026-03-01T11:00:00"
    })
    
    trail = get_live_cdr_trail(phone)
    assert len(trail) == 3
    assert [t["tower_id"] for t in trail] == ["TOWER-A", "TOWER-B", "TOWER-C"]


def test_geofence_intercept_trigger():
    packet = {
        "caller": "+919555112233",
        "callee": "+919444332211",
        "tower_id": "TWR-RED-FORT-01",
        "latitude": 28.6562,
        "longitude": 77.2410,
        "active_geofence": {
            "center_lat": 28.6565,
            "center_lon": 77.2412,
            "radius_km": 0.5
        }
    }
    res = ingest_live_cdr_packet(packet)
    assert res["in_geofence"] is True
    assert res["alert"] is not None
    assert res["alert"]["tower_id"] == "TWR-RED-FORT-01"
