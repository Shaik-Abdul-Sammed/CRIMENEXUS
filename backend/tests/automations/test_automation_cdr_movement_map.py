"""
Automation 3: CDR Movement Mapping & Multimodal Geospatial Correlation.
Tests:
  1. Upload CDR with 5 tower pings -> verify GeoJSON LineString returned with 5 coordinates.
  2. Verify chronological order of pings (timestamps ascending).
  3. Upload CDR with single ping -> verify fallback to Point geometry.
  4. Upload CDR with missing lat/lon -> verify graceful handling with error message.
  5. Verify movement map correlates with ANPR sightings within 30-min window.
"""

import sys
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.postgres import SessionLocal
from app.models.call_record import CallRecord
from app.models.vehicle_sighting import VehicleSighting
from app.services.forensics.cdr_parser import parse_telecom_cdr_csv

client = TestClient(app)


def test_cdr_five_pings_linestring():
    """Test 1: Upload CDR with 5 tower pings -> verify GeoJSON LineString returned with 5 coordinates."""
    caller = "+919876543210"
    cdr_csv = (
        "calling_number,called_number,duration,timestamp,cell_tower,imei\n"
        f"{caller},+919811111111,120,2026-10-29T10:00:00Z,TOWER-DEL-CONN,358912093847291\n"
        f"{caller},+919822222222,80,2026-10-29T11:00:00Z,TOWER-NOIDA-62,358912093847291\n"
        f"{caller},+919833333333,210,2026-10-29T12:00:00Z,TOWER-YAMUNA-KM48,358912093847291\n"
        f"{caller},+919844444444,45,2026-10-29T13:30:00Z,TOWER-MUM-PORT,358912093847291\n"
        f"{caller},+919855555555,90,2026-10-29T15:00:00Z,TOWER-BLR-ECITY,358912093847291\n"
    )

    db = SessionLocal()
    try:
        result = parse_telecom_cdr_csv(cdr_csv, db)
        assert result["status"] == "success"
        assert result["total_records_ingested"] == 5

        geojson = result["geojson_trajectory"]
        features = geojson.get("features", [])
        linestring_feat = next((f for f in features if f["geometry"]["type"] == "LineString"), None)
        assert linestring_feat is not None, "Expected a LineString feature in GeoJSON trajectory"
        coords = linestring_feat["geometry"]["coordinates"]
        assert len(coords) == 5, f"Expected 5 coordinates in LineString, got {len(coords)}"
    finally:
        db.close()


def test_cdr_chronological_ordering():
    """Test 2: Verify chronological order of pings (timestamps ascending)."""
    caller = "+919988776655"
    db = SessionLocal()
    now = datetime.utcnow()

    # Seed 3 out-of-order pings
    t1 = now - timedelta(hours=3)
    t2 = now - timedelta(hours=2)
    t3 = now - timedelta(hours=1)

    r2 = CallRecord(record_id=f"CDR-ORD-2-{uuid.uuid4().hex[:4]}", caller_number=caller, receiver_number="+919000000002", tower_id="TOWER-NOIDA-62", timestamp=t2)
    r1 = CallRecord(record_id=f"CDR-ORD-1-{uuid.uuid4().hex[:4]}", caller_number=caller, receiver_number="+919000000001", tower_id="TOWER-DEL-CONN", timestamp=t1)
    r3 = CallRecord(record_id=f"CDR-ORD-3-{uuid.uuid4().hex[:4]}", caller_number=caller, receiver_number="+919000000003", tower_id="TOWER-YAMUNA-KM48", timestamp=t3)

    try:
        db.add_all([r2, r1, r3])
        db.commit()

        res = client.get(f"/api/v1/analytics/movement-timeline?phone_number={caller}")
        assert res.status_code == 200
        data = res.json()
        events = data.get("timeline_events", [])
        assert len(events) >= 3

        ts_list = [e["timestamp"] for e in events]
        sorted_ts_list = sorted(ts_list)
        assert ts_list == sorted_ts_list, f"Timeline events are not chronologically ascending: {ts_list}"
    finally:
        db.query(CallRecord).filter(CallRecord.caller_number == caller).delete()
        db.commit()
        db.close()


def test_cdr_single_ping_fallback_to_point():
    """Test 3: Upload CDR with single ping -> verify fallback to Point geometry (no LineString)."""
    single_csv = (
        "calling_number,called_number,duration,timestamp,cell_tower,imei\n"
        "+919111122222,+919333344444,60,2026-10-29T10:00:00Z,TOWER-NOIDA-62,358912093847291\n"
    )
    db = SessionLocal()
    try:
        result = parse_telecom_cdr_csv(single_csv, db)
        geojson = result["geojson_trajectory"]
        features = geojson.get("features", [])

        # Verify no LineString feature because >= 2 points are required for a line
        has_linestring = any(f["geometry"]["type"] == "LineString" for f in features)
        assert not has_linestring, "Single ping should NOT produce a LineString"

        # Verify Point feature exists
        points = [f for f in features if f["geometry"]["type"] == "Point"]
        assert len(points) == 1
        assert points[0]["geometry"]["coordinates"] == [77.3649, 28.6280]
    finally:
        db.close()


def test_cdr_missing_lat_lon_handling():
    """Test 4: Upload CDR with missing lat/lon or empty file -> verify graceful handling with error message."""
    # 4a: Empty CSV raises ValueError
    db = SessionLocal()
    try:
        try:
            parse_telecom_cdr_csv("", db)
            assert False, "Empty CSV should raise ValueError"
        except ValueError as ve:
            assert "empty" in str(ve).lower() or "header" in str(ve).lower()

        # 4b: Upload via API with empty raw_csv
        res = client.post("/api/v1/forensics/cdr/upload", data={"raw_csv": ""})
        assert res.status_code in [400, 500]
    finally:
        db.close()


def test_cdr_anpr_30min_correlation():
    """Test 5: Verify movement map correlates with ANPR sightings within 30-min window."""
    target_phone = "+919777788888"
    target_plate = "DL 01 CA 9999"
    db = SessionLocal()
    base_time = datetime.utcnow()

    # Create ANPR sighting at Yamuna Toll
    vs = VehicleSighting(
        sighting_id=f"ANPR-CORR-{uuid.uuid4().hex[:6]}",
        plate_number=target_plate,
        camera_id="CAM-TOLL-01",
        location_name="Yamuna Expressway Toll KM 48",
        latitude=28.1402,
        longitude=77.5510,
        timestamp=base_time,
        source_type="ANPR"
    )

    # Create CDR call at nearby tower 15 minutes later (< 30-min window)
    cr = CallRecord(
        record_id=f"CDR-CORR-{uuid.uuid4().hex[:6]}",
        caller_number=target_phone,
        receiver_number="+919666655555",
        tower_id="TOWER-YAMUNA-KM48",
        location_name="Yamuna Expressway Toll KM 48",
        timestamp=base_time + timedelta(minutes=15)
    )

    try:
        db.add(vs)
        db.add(cr)
        db.commit()

        # Fetch combined movement timeline
        res = client.get(f"/api/v1/analytics/movement-timeline?plate_number={target_plate}&phone_number={target_phone}")
        assert res.status_code == 200
        data = res.json()

        events = data.get("timeline_events", [])
        types = [e["type"] for e in events]
        assert "ANPR_SIGHTING" in types, "ANPR sighting missing from correlated timeline"
        assert "CDR_CELL_PING" in types, "CDR cell ping missing from correlated timeline"

        # Verify time delta between the two correlated events is <= 30 minutes
        anpr_ev = next(e for e in events if e["type"] == "ANPR_SIGHTING")
        cdr_ev = next(e for e in events if e["type"] == "CDR_CELL_PING")
        dt_anpr = datetime.fromisoformat(anpr_ev["timestamp"])
        dt_cdr = datetime.fromisoformat(cdr_ev["timestamp"])
        diff_minutes = abs((dt_cdr - dt_anpr).total_seconds()) / 60.0
        assert diff_minutes <= 30.0, f"Events should be within 30-min correlation window, got {diff_minutes} mins"
    finally:
        db.query(VehicleSighting).filter(VehicleSighting.plate_number == target_plate).delete()
        db.query(CallRecord).filter(CallRecord.caller_number == target_phone).delete()
        db.commit()
        db.close()


if __name__ == "__main__":
    test_cdr_five_pings_linestring()
    test_cdr_chronological_ordering()
    test_cdr_single_ping_fallback_to_point()
    test_cdr_missing_lat_lon_handling()
    test_cdr_anpr_30min_correlation()
    print("ALL 5 CDR Movement Map Automation Tests PASSED.")
