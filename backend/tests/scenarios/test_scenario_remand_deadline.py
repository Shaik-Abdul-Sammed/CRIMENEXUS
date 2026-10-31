"""
Scenario: Remand Deadline Clock & Default Bail Statutory Monitor.
Enforces Indian Criminal Procedure (Sec 57 & 167 CrPC, Sec 58 & 187 BNSS 2023):
  1. Test 1: Start custody -> verify remand expiry is set to 24h from arrest.
  2. Test 2: Mock time 23 hours later -> verify HIGH priority magistrate alert generated.
  3. Test 3: Mock time 58 days after arrest -> verify charge sheet default bail warning generated.
  4. Test 4: Close custody -> verify no further alerts generated for closed case.
  5. Test 5: REST API endpoints validation (start, summary, active, close).
"""

from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.postgres import SessionLocal
from app.models.custody_tracker import CustodyTracker
from app.models.alert import Alert
from app.services.legal.custody_monitor import (
    start_custody_tracking,
    close_custody_tracking,
    check_upcoming_deadlines
)

client = TestClient(app)


def test_scenario_remand_deadline_lifecycle():
    db = SessionLocal()
    # Clean previous test entries
    db.query(Alert).filter(Alert.alert_type.in_(["REMAND_24H_MAGISTRATE_DEADLINE", "CHARGE_SHEET_DEFAULT_BAIL_WARNING"])).delete(synchronize_session=False)
    db.query(CustodyTracker).filter(CustodyTracker.case_id == "FIR-2026-DEL-9812").delete(synchronize_session=False)
    db.commit()

    arrest_time = datetime(2026, 11, 1, 10, 0, 0)

    # --- Test 1: Start custody -> verify remand expiry is set to 24h from arrest ---
    tracker = start_custody_tracking(
        case_id="FIR-2026-DEL-9812",
        suspect_id="SUSP-991",
        suspect_name="Ramesh Kumar @ Monu",
        arrest_timestamp=arrest_time,
        days_charge_sheet=60,
        investigating_officer="Insp. Virendra",
        police_station="PS Kotwali",
        offenses="Section 310 BNS (Robbery)",
        db=db
    )

    assert tracker.id is not None
    assert tracker.status == "ACTIVE"
    expected_remand_expiry = arrest_time + timedelta(hours=24)
    expected_cs_deadline = arrest_time + timedelta(days=60)
    assert tracker.remand_expiry_timestamp == expected_remand_expiry
    assert tracker.charge_sheet_deadline == expected_cs_deadline

    # Verify no immediate alerts if checked right after arrest (24h remaining > 4h)
    immediate_alerts = check_upcoming_deadlines(reference_time=arrest_time + timedelta(hours=2), db=db)
    remand_alerts_init = [a for a in immediate_alerts if a["case_id"] == "FIR-2026-DEL-9812" and a["type"] == "REMAND_MAGISTRATE"]
    assert len(remand_alerts_init) == 0, "No alerts expected when 22 hours remain"

    # --- Test 2: Mock time 23 hours later -> verify HIGH priority magistrate alert ---
    mock_t23h = arrest_time + timedelta(hours=23)  # Only 1 hour remaining until 24h expiry
    alerts_23h = check_upcoming_deadlines(reference_time=mock_t23h, db=db)
    remand_alerts = [a for a in alerts_23h if a["case_id"] == "FIR-2026-DEL-9812" and a["type"] == "REMAND_MAGISTRATE"]
    assert len(remand_alerts) == 1
    assert remand_alerts[0]["suspect"] == "Ramesh Kumar @ Monu"
    assert round(remand_alerts[0]["hours_remaining"], 1) == 1.0

    # Verify alert in database
    db_alert = db.query(Alert).filter(
        Alert.alert_type == "REMAND_24H_MAGISTRATE_DEADLINE",
        Alert.title.contains("Ramesh Kumar")
    ).first()
    assert db_alert is not None
    assert db_alert.severity == "high"
    assert db_alert.threat_score >= 0.90
    assert "Article 22(2)" in db_alert.description

    # --- Test 3: Mock time 58 days after arrest -> verify charge sheet deadline warning ---
    mock_t58d = arrest_time + timedelta(days=58)  # 2 days remaining until 60-day deadline
    alerts_58d = check_upcoming_deadlines(reference_time=mock_t58d, db=db)
    cs_alerts = [a for a in alerts_58d if a["case_id"] == "FIR-2026-DEL-9812" and a["type"] == "CHARGE_SHEET_DEADLINE"]
    assert len(cs_alerts) == 1
    assert round(cs_alerts[0]["days_remaining"], 1) == 2.0

    # Verify alert in database
    cs_db_alert = db.query(Alert).filter(
        Alert.alert_type == "CHARGE_SHEET_DEFAULT_BAIL_WARNING",
        Alert.title.contains("Ramesh Kumar")
    ).first()
    assert cs_db_alert is not None
    assert cs_db_alert.severity == "medium"
    assert "default bail" in cs_db_alert.description.lower()

    # --- Test 4: Close custody -> verify no further alerts ---
    closed_record = close_custody_tracking(
        custody_id=tracker.id,
        notes="Produced before Judicial Magistrate First Class. Remanded to 14 days judicial custody.",
        db=db
    )
    assert closed_record.status == "CLOSED"
    assert closed_record.closed_at is not None

    # Clear alerts and re-check at 59 days -> should NOT trigger since status is CLOSED
    db.query(Alert).filter(Alert.alert_type.in_(["REMAND_24H_MAGISTRATE_DEADLINE", "CHARGE_SHEET_DEFAULT_BAIL_WARNING"])).delete(synchronize_session=False)
    db.commit()

    alerts_post_close = check_upcoming_deadlines(reference_time=arrest_time + timedelta(days=59), db=db)
    closed_alerts = [a for a in alerts_post_close if a["case_id"] == "FIR-2026-DEL-9812"]
    assert len(closed_alerts) == 0, "No alerts must be generated for CLOSED custody"

    db.close()


def test_scenario_remand_api_endpoints():
    # --- Test 5: REST API endpoints validation ---
    # Start custody via API
    start_payload = {
        "case_id": "FIR-2026-MAH-4411",
        "suspect_id": "SUSP-1044",
        "suspect_name": "Vijay Salgaonkar",
        "days_charge_sheet": 90,
        "investigating_officer": "PSI Gaikwad",
        "police_station": "PS Miramar Panaji",
        "offenses": "Section 103 BNS (Murder) / 302 IPC",
        "notes": "Arrested at residence"
    }
    res_start = client.post("/api/v1/legal/custody/start", json=start_payload)
    assert res_start.status_code == 200, res_start.text
    data = res_start.json()
    assert data["status"] == "TRACKING_STARTED"
    custody_id = data["custody_id"]

    # Check active list
    res_active = client.get("/api/v1/legal/custody/active")
    assert res_active.status_code == 200
    active_cases = res_active.json()
    matched = [c for c in active_cases if c["id"] == custody_id]
    assert len(matched) == 1
    assert matched[0]["suspect_name"] == "Vijay Salgaonkar"
    assert "remand_hours_remaining" in matched[0]
    assert "charge_sheet_days_remaining" in matched[0]

    # Check summary metrics
    res_summary = client.get("/api/v1/legal/custody/summary")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert summary["active_custody_total"] >= 1
    assert "magistrate_production_due_today" in summary
    assert "chargesheet_due_7_days" in summary

    # Close custody via API
    res_close = client.patch(f"/api/v1/legal/custody/{custody_id}/close", json={"notes": "Bail rejected, sent to Central Jail"})
    assert res_close.status_code == 200
    assert res_close.json()["status"] == "CLOSED"

    # Verify no longer active
    res_active_2 = client.get("/api/v1/legal/custody/active")
    assert all(c["id"] != custody_id for c in res_active_2.json())
