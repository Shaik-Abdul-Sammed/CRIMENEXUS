import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_a1_gun_intelligence_wiring():
    """A1: Verify gun intelligence queries live traces and handles new trace submission."""
    res_get = client.get("/api/v1/gun-intelligence/traces")
    assert res_get.status_code == 200
    data = res_get.json()
    assert "total_traces" in data
    assert "traces" in data
    assert len(data["traces"]) >= 1
    # Regression check: verify no static benchmark stub data returned
    assert all("BENCHMARK_" not in str(t) for t in data["traces"])

    payload = {
        "serial_number": "TEST-WIRING-9901",
        "make": "Glock Austria",
        "model": "17 Gen 5",
        "caliber": "9x19mm Parabellum",
        "recovery_fir": "FIR-2026-TEST-99",
        "recovery_location": "Delhi Border Checkpoint",
        "recovery_date": "2026-02-10",
        "first_retail_date": "2026-01-15",
        "purchaser_name": "Test Dealer"
    }
    res_post = client.post("/api/v1/gun-intelligence/trace", json=payload)
    assert res_post.status_code == 200
    res_data = res_post.json()
    assert res_data["serial_number"] == "TEST-WIRING-9901"
    assert res_data["is_straw_purchase"] is True  # Time to crime <= 90 days

def test_a2_ibis_ballistics_wiring():
    """A2: Verify IBIS specimens retrieval and perceptual hash / cosine matching."""
    res_specs = client.get("/api/v1/ibis/specimens")
    assert res_specs.status_code == 200
    specimens = res_specs.json()
    assert len(specimens) >= 1
    # Regression check: verify no static benchmark specimens returned
    assert all("BENCHMARK_" not in str(s) for s in specimens)

    match_payload = {
        "specimen_id": "TEST-IBIS-CAS-01",
        "caliber": "9mm parabellum",
        "rifling_lands": 6,
        "twist_direction": "RIGHT",
        "striation_pitch_mm": 0.126
    }
    res_match = client.post("/api/v1/ibis/match", json=match_payload)
    assert res_match.status_code == 200
    match_data = res_match.json()
    assert "results" in match_data
    assert match_data["matches_found"] >= 1
    assert match_data["model_engine"] in ["resnet18", "fallback_hash"]
    top_hit = match_data["results"][0]
    assert "perceptual_hash" in top_hit
    assert "cosine_alignment" in top_hit
    assert top_hit["correlation_score"] >= 80.0

def test_a3_geofence_warrant_wiring():
    """A3: Verify geofence warrant ray-casting polygon math and device listing."""
    res_health = client.get("/api/v1/geofence/health")
    assert res_health.status_code == 200

    payload = {
        "case_id": "FIR-2026-GEO-TEST",
        "crime_description": "Bank robbery at NCR node",
        "polygon_coordinates": "Polygon((28.665 77.268, 28.668 77.268, 28.668 77.272, 28.665 77.272))",
        "time_window_start": "2026-01-28T02:00:00Z",
        "time_window_end": "2026-01-28T03:30:00Z",
        "magistrate_approval_ref": "CMM Tis Hazari Courts"
    }
    res_warrant = client.post("/api/v1/geofence/warrant", json=payload)
    assert res_warrant.status_code == 200
    war_data = res_warrant.json()
    assert "warrant_id" in war_data
    assert "step_2_anonymized_candidates" in war_data
    assert len(war_data["step_2_anonymized_candidates"]) >= 1

def test_a4_osint_monitor_wiring():
    """A4: Verify OSINT threat scanning with NER extraction and graph cross-referencing."""
    res_alerts = client.get("/api/v1/osint/alerts")
    assert res_alerts.status_code == 200
    data = res_alerts.json()
    assert "alerts" in data
    assert len(data["alerts"]) >= 1

    scan_res = client.post("/api/v1/osint/scan", json={
        "raw_text": "Illegal consignment of Glock pistol and ammunition seized at border for Rajan."
    })
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert "threat_score" in scan_data
    assert scan_data["threat_score"] > 50.0
    assert "extracted_entities" in scan_data

def test_a5_imsi_catcher_wiring():
    """A5: Verify IMSI catcher session registration and 72-hour purge."""
    res_sess = client.get("/api/v1/imsi/sessions")
    assert res_sess.status_code == 200

    new_sess = client.post("/api/v1/imsi/session", json={
        "operation_name": "Test Op Intercept",
        "target_imsi": "404450998877665",
        "warrant_number": "WAR-TEST-2026-01",
        "location_polygon": "Polygon((28.6 77.2, 28.7 77.2, 28.7 77.3, 28.6 77.3))",
        "authorized_duration_hours": 72
    })
    assert new_sess.status_code == 200
    sess_data = new_sess.json()
    assert "audit_hash" in sess_data
    assert sess_data["status"] == "ACTIVE_AUTHORIZED"

    purge_res = client.post("/api/v1/imsi/purge-expired")
    assert purge_res.status_code == 200
    assert purge_res.json()["status"] == "SUCCESS"

def test_a6_interpol_sync_wiring():
    """A6: Verify Interpol notice querying and red notice drafting with audit ledger."""
    res_notices = client.get("/api/v1/interpol/notices")
    assert res_notices.status_code == 200
    notices_data = res_notices.json()
    assert "notices" in notices_data
    assert len(notices_data["notices"]) >= 1

    draft_res = client.post("/api/v1/interpol/draft-red-notice", json={
        "suspect_id": "TEST-FUGITIVE-01",
        "suspect_name": "Fugitive Operative",
        "charges": "Transnational organized crime and arms trafficking",
        "fir_number": "FIR-2026-RED-99",
        "target_jurisdictions": ["UAE", "Canada"]
    })
    assert draft_res.status_code == 200
    assert draft_res.json()["status"] == "READY_FOR_MHA_CLEARANCE"

def test_a7_digital_footprint_data_lake_wiring():
    """A7: Verify 96-source data lake ingestion counts from real streams and database."""
    res = client.get("/api/v1/escape-demo/data-lake")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["sources_connected"] == 96
    assert data["total_clues_ingested"] >= 4210
    assert len(data["critical_clues"]) >= 2

def test_a8_smart_meter_anomalies_wiring():
    """A8: Verify smart meter anomalies heatmap spatial layer."""
    res = client.get("/api/v1/escape-demo/smart-meter-anomalies")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "anomalies" in data
    assert len(data["anomalies"]) >= 4
    assert data.get("source") in ["smart_meter_table", "vehicle_sighting_proxy"]
