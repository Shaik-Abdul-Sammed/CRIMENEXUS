import pytest
from app.api.gun_intelligence import gun_intelligence_health, get_gun_traces, submit_firearm_trace, FirearmTraceRequest

def test_gun_intelligence_happy_path_straw_purchase():
    """Happy Path: Recovers a weapon with time-to-crime < 90 days and flags as straw purchase."""
    health = gun_intelligence_health()
    assert health["status"] == "healthy"
    
    req = FirearmTraceRequest(
        serial_number="TEST-SR-8819",
        make="Beretta Clone",
        model="92FS",
        caliber="9mm",
        recovery_fir="FIR-2026-TEST-99",
        recovery_location="Delhi Outer Ring Rd",
        recovery_date="2026-02-10",
        first_retail_date="2026-01-05" # ~36 days -> Straw purchase!
    )
    res = submit_firearm_trace(req)
    assert res["is_straw_purchase"] is True
    assert res["time_to_crime_days"] <= 90
    assert "STRAW_PURCHASE" in res["status"]

def test_gun_intelligence_aged_weapon_edge_case():
    """Edge Case: Weapon purchased 3 years ago (time-to-crime > 1000 days) is not flagged as straw purchase."""
    req = FirearmTraceRequest(
        serial_number="LEGIT-OLD-GUN",
        make="OFB",
        model="Revolver .32",
        caliber=".32",
        recovery_fir="FIR-2026-OLD-01",
        recovery_location="Connaught Place",
        recovery_date="2026-02-10",
        first_retail_date="2022-01-01"
    )
    res = submit_firearm_trace(req)
    assert res["is_straw_purchase"] is False
    assert res["time_to_crime_days"] > 90

def test_gun_intelligence_traces_roster():
    """Validation: Retrieves all tracked traces from CGIC registry."""
    data = get_gun_traces()
    assert data["total_traces"] >= 2
    assert "straw_purchases_detected" in data
