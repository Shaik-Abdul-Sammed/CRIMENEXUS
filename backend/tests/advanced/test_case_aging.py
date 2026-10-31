import datetime
import pytest
from app.services.analytics.case_aging import (
    analyze_case_aging,
    aggregate_station_case_aging,
    AgingSeverity
)

def test_on_track_case():
    ref_date = datetime.datetime(2026, 3, 1, 12, 0, 0)
    case = {
        "case_id": "FIR-2026-001",
        "created_at": "2026-02-20T10:00:00",
        "last_activity_at": "2026-02-28T15:00:00",
        "offense_type": "IPC 379 THEFT",
        "has_charge_sheet": False,
        "status": "INVESTIGATION_OPEN"
    }
    result = analyze_case_aging(case, reference_date=ref_date)
    assert result["case_age_days"] == 9
    assert result["inactivity_days"] in (0, 1)
    assert result["severity"] == AgingSeverity.ON_TRACK.value
    assert result["is_stalled"] is False


def test_stalled_case_medium_severity():
    ref_date = datetime.datetime(2026, 3, 1, 12, 0, 0)
    case = {
        "case_id": "FIR-2026-002",
        "created_at": "2026-01-10T10:00:00",
        "last_activity_at": "2026-01-20T10:00:00",  # Inactive > 40 days
        "offense_type": "IPC 420 CHEATING",
        "has_charge_sheet": False,
        "status": "INVESTIGATION_OPEN"
    }
    result = analyze_case_aging(case, reference_date=ref_date)
    assert result["inactivity_days"] >= 40
    assert result["severity"] == AgingSeverity.STALLED_MEDIUM.value
    assert result["is_stalled"] is True
    assert "Zero case diary entries" in result["alert_message"]


def test_statutory_breach_pocso_60_days():
    ref_date = datetime.datetime(2026, 3, 1, 12, 0, 0)
    case = {
        "case_id": "FIR-2026-003",
        "created_at": "2025-12-15T10:00:00",  # 76 days old
        "last_activity_at": "2026-02-28T10:00:00",
        "offense_type": "POCSO ACT SEC 6",
        "has_charge_sheet": False,
        "status": "INVESTIGATION_OPEN"
    }
    result = analyze_case_aging(case, reference_date=ref_date)
    assert result["statutory_limit_days"] == 60
    assert result["case_age_days"] > 60
    assert result["severity"] == AgingSeverity.STATUTORY_BREACH_CRITICAL.value
    assert result["is_stalled"] is True
    assert "Statutory limit of 60 days exceeded" in result["alert_message"]


def test_aggregate_station_case_aging():
    ref_date = datetime.datetime(2026, 3, 1, 12, 0, 0)
    cases = [
        {"case_id": "C1", "created_at": "2026-02-25T00:00:00", "has_charge_sheet": False}, # < 30d
        {"case_id": "C2", "created_at": "2026-01-15T00:00:00", "has_charge_sheet": False}, # 30-60d
        {"case_id": "C3", "created_at": "2025-12-01T00:00:00", "has_charge_sheet": False, "offense_type": "MURDER"}, # > 90d
    ]
    summary = aggregate_station_case_aging(cases, reference_date=ref_date)
    assert summary["total_cases_analyzed"] == 3
    assert summary["aging_buckets"]["under_30_days"] == 1
    assert summary["aging_buckets"]["30_to_60_days"] == 1
    assert summary["aging_buckets"]["over_90_days_critical"] == 1
    assert summary["critical_statutory_breaches"] >= 1
