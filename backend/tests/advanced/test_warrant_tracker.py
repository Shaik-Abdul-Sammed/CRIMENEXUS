import pytest
import datetime
from app.services.warrants.warrant_tracker import (
    register_warrant,
    search_warrants,
    execute_warrant,
    get_expiring_locs,
    clear_warrant_store_for_tests,
    WarrantType,
    WarrantStatus
)

@pytest.fixture(autouse=True)
def setup_warrants():
    clear_warrant_store_for_tests()


def test_register_and_search_warrant():
    w = register_warrant({
        "case_id": "FIR-MAHA-2025-9901",
        "suspect_name": "Rajesh Kumar Sharma",
        "alias": "Raju Nepali",
        "warrant_type": WarrantType.NON_BAILABLE.value,
        "issuing_court": "Session Court Pune",
        "issuing_state": "MAHARASHTRA",
        "issuing_station": "PS_SHIVAJINAGAR"
    })
    
    assert w["status"] == WarrantStatus.ACTIVE.value
    assert w["warrant_id"].startswith("WRT-")
    
    # Search by alias
    res_alias = search_warrants("Nepali")
    assert len(res_alias) == 1
    assert res_alias[0]["suspect_name"] == "Rajesh Kumar Sharma"

    # Search by state filter
    res_maha = search_warrants("Rajesh", state="MAHARASHTRA")
    assert len(res_maha) == 1
    
    # Cross-state query mismatch
    res_delhi = search_warrants("Rajesh", state="DELHI")
    assert len(res_delhi) == 0


def test_execute_warrant_audit_trail():
    w = register_warrant({
        "case_id": "FIR-DEL-2026-102",
        "suspect_name": "Devendra Yadav",
        "warrant_type": WarrantType.PROCLAIMED_OFFENDER.value
    })
    
    executed = execute_warrant(
        warrant_id=w["warrant_id"],
        executing_officer="Inspector Amit Deshmukh",
        executing_station="PS_AIRPORT_SECURITY",
        notes="Apprehended during terminal boarding check"
    )
    
    assert executed["status"] == WarrantStatus.EXECUTED.value
    assert executed["execution_details"]["executing_officer"] == "Inspector Amit Deshmukh"
    
    # After execution, active search returns 0
    active_search = search_warrants("Devendra")
    assert len(active_search) == 0


def test_expiring_loc_alert_threshold():
    # Register an LOC expiring in 5 days
    exp_5_days = (datetime.datetime.utcnow() + datetime.timedelta(days=5)).isoformat()
    register_warrant({
        "case_id": "CBI-RC-2024-001",
        "suspect_name": "Vijay M.",
        "warrant_type": WarrantType.LOOK_OUT_CIRCULAR.value,
        "expiry_date": exp_5_days
    })
    
    # Register an LOC expiring in 45 days
    exp_45_days = (datetime.datetime.utcnow() + datetime.timedelta(days=45)).isoformat()
    register_warrant({
        "case_id": "CBI-RC-2024-002",
        "suspect_name": "Nirav M.",
        "warrant_type": WarrantType.LOOK_OUT_CIRCULAR.value,
        "expiry_date": exp_45_days
    })
    
    expiring = get_expiring_locs(days_threshold=15)
    assert len(expiring) == 1
    assert expiring[0]["suspect_name"] == "Vijay M."
    assert expiring[0]["days_until_expiry"] <= 5.1
