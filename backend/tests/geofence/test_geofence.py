import pytest
from app.api.geofence import geofence_health, get_geofence_warrants, register_geofence_warrant, deanonymize_device, GeofenceWarrantRequest, DeAnonymizeRequest

def test_geofence_happy_path_pipeline():
    """Happy Path: Registers a reverse-location geofence warrant adhering to 3-step narrowing."""
    health = geofence_health()
    assert health["status"] == "healthy"
    assert "Puttaswamy" in health["constitutional_compliance"]
    
    req = GeofenceWarrantRequest(
        case_id="FIR-2026-HEIST-01",
        crime_description="Jewelry Store Burglary",
        polygon_coordinates="Polygon((28.5 77.1, 28.6 77.1, 28.6 77.2, 28.5 77.1))",
        time_window_start="2026-02-01T01:00:00Z",
        time_window_end="2026-02-01T02:00:00Z",
        magistrate_approval_ref="CMM Saket Courts"
    )
    war = register_geofence_warrant(req)
    assert war["step_1_total_devices_in_polygon"] > 0
    assert len(war["step_2_anonymized_candidates"]) >= 1
    assert war["constitutional_status"] == "ANONYMIZED_REVIEW_IN_PROGRESS"

def test_geofence_deanonymize_step3():
    """Action Path: De-anonymizes a device only upon providing probable cause affidavit."""
    req = DeAnonymizeRequest(
        warrant_id="GEO-WAR-2026-01",
        anonymized_device_id="ANON-DEV-44",
        probable_cause_affidavit="Device observed lingering 28 minutes during dacoity"
    )
    res = deanonymize_device(req)
    assert res["device_anon_id"] == "ANON-DEV-44"
    assert res["probable_cause_verified"] is True
    assert "revealed_imsi" in res

def test_geofence_invalid_warrant_not_found():
    """Failure Path: Attempting to de-anonymize under non-existent warrant raises 404."""
    from fastapi import HTTPException
    req = DeAnonymizeRequest(
        warrant_id="NON-EXISTENT-WARRANT-999",
        anonymized_device_id="ANON-01",
        probable_cause_affidavit="Testing missing warrant"
    )
    with pytest.raises(HTTPException) as exc_info:
        deanonymize_device(req)
    assert exc_info.value.status_code == 404
