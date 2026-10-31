import pytest
from fastapi import HTTPException
from app.security.rls import (
    TenancyContext,
    OfficerRole,
    JurisdictionalLevel,
    check_record_access,
    enforce_tenancy,
)

def test_station_io_cannot_access_different_station_record():
    context_station_a = TenancyContext(
        user_id="officer_01",
        role=OfficerRole.IO,
        station_id="PS_CONNAUGHT_PLACE",
        district_id="NEW_DELHI",
        state_id="DELHI"
    )
    
    # Same station -> Allowed
    assert check_record_access(
        record_station_id="PS_CONNAUGHT_PLACE",
        record_district_id="NEW_DELHI",
        record_state_id="DELHI",
        context=context_station_a
    ) is True

    # Different station in same district -> Denied for IO
    assert check_record_access(
        record_station_id="PS_CHANAKYAPURI",
        record_district_id="NEW_DELHI",
        record_state_id="DELHI",
        context=context_station_a
    ) is False

    with pytest.raises(HTTPException) as exc_info:
        enforce_tenancy(
            record_station_id="PS_CHANAKYAPURI",
            record_district_id="NEW_DELHI",
            record_state_id="DELHI",
            context=context_station_a
        )
    assert exc_info.value.status_code == 403
    assert "Jurisdictional access denied" in exc_info.value.detail


def test_district_sp_can_access_all_stations_in_district():
    sp_context = TenancyContext(
        user_id="sp_delhi_central",
        role=OfficerRole.SP,
        station_id=None,
        district_id="CENTRAL_DELHI",
        state_id="DELHI"
    )
    
    # Station in same district -> Allowed
    assert check_record_access(
        record_station_id="PS_DARYAGANJ",
        record_district_id="CENTRAL_DELHI",
        record_state_id="DELHI",
        context=sp_context
    ) is True

    # Station in different district -> Denied for District SP
    assert check_record_access(
        record_station_id="PS_BANDRA",
        record_district_id="MUMBAI_SUBURBAN",
        record_state_id="MAHARASHTRA",
        context=sp_context
    ) is False


def test_state_cid_and_cbi_have_broad_jurisdiction():
    cid_context = TenancyContext(
        user_id="cid_inspector_12",
        role=OfficerRole.CID,
        station_id=None,
        district_id=None,
        state_id="MAHARASHTRA"
    )
    
    # Across Maharashtra -> Allowed
    assert check_record_access(
        record_station_id="PS_COLABA",
        record_district_id="MUMBAI_CITY",
        record_state_id="MAHARASHTRA",
        context=cid_context
    ) is True
    
    # Across other state -> Denied for State CID
    assert check_record_access(
        record_station_id="PS_CONNAUGHT_PLACE",
        record_district_id="NEW_DELHI",
        record_state_id="DELHI",
        context=cid_context
    ) is False

    # National CBI -> Unrestricted
    cbi_context = TenancyContext(
        user_id="cbi_sp_01",
        role=OfficerRole.CBI,
        station_id=None,
        district_id=None,
        state_id=None
    )
    assert check_record_access(
        record_station_id="PS_CONNAUGHT_PLACE",
        record_district_id="NEW_DELHI",
        record_state_id="DELHI",
        context=cbi_context
    ) is True


def test_shared_station_collaborative_investigation():
    context_station_a = TenancyContext(
        user_id="officer_01",
        role=OfficerRole.IO,
        station_id="PS_CONNAUGHT_PLACE",
        district_id="NEW_DELHI",
        state_id="DELHI"
    )
    
    # Inter-station joint task force sharing
    assert check_record_access(
        record_station_id="PS_CHANAKYAPURI",
        record_district_id="NEW_DELHI",
        record_state_id="DELHI",
        context=context_station_a,
        shared_stations=["PS_CHANAKYAPURI", "PS_CONNAUGHT_PLACE"]
    ) is True
