import pytest
from app.services.legal.time_travel import (
    get_case_snapshot_at,
    diff_case_snapshots
)

def test_time_travel_snapshot_at_different_dates():
    case_id = "CASE-DEL-2026-0042"
    
    # Early date: only suspect exists
    early_snapshot = get_case_snapshot_at(case_id, as_of="2026-01-11T00:00:00")
    assert early_snapshot["entity_count"] == 1
    assert early_snapshot["entities"][0]["name"] == "Vikram Singh"
    assert early_snapshot["edge_count"] == 0

    # Middle date: suspect and phone exist
    mid_snapshot = get_case_snapshot_at(case_id, as_of="2026-01-15T00:00:00")
    assert mid_snapshot["entity_count"] == 2
    assert mid_snapshot["edge_count"] == 1
    assert mid_snapshot["edges"][0]["relationship"] == "USES_PHONE"

    # Late date: all entities exist
    late_snapshot = get_case_snapshot_at(case_id, as_of="2026-03-01T00:00:00")
    assert late_snapshot["entity_count"] == 4
    assert late_snapshot["edge_count"] == 3
    assert len(late_snapshot["state_hash"]) == 64


def test_time_travel_diff_computes_added_evidence():
    case_id = "CASE-DEL-2026-0042"
    
    diff = diff_case_snapshots(
        case_id=case_id,
        time_t1="2026-01-11T00:00:00",
        time_t2="2026-01-25T00:00:00"
    )
    
    assert diff["net_growth"] == 2
    assert len(diff["entities_added"]) == 2
    # Verify added types are Phone and Vehicle
    added_types = {e["type"] for e in diff["entities_added"]}
    assert "Phone" in added_types
    assert "Vehicle" in added_types
    assert diff["hash_t1"] != diff["hash_t2"]
