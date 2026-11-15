import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.postgres import SessionLocal
from app.models.case import Case

client = TestClient(app)

def test_c1_brady_giglio_disclosure_wiring():
    """C1: Verify Brady/Giglio impeachment disclosure ledger."""
    res = client.get("/api/v1/officers/DL-POL-IO-8812/disclosure")
    assert res.status_code == 200
    data = res.json()
    assert "constitutional_standard" in data
    assert "disclosures" in data
    assert "sustained_brady_findings_count" in data

def test_c2_cpia_unused_material_schedule_wiring():
    """C2: Verify CPIA 1996 MG6C/MG6D unused material logging and schedule generation."""
    res_get = client.get("/api/v1/cases/FIR-2026-TRIAL-01/unused-material")
    assert res_get.status_code == 200
    data = res_get.json()
    assert "items" in data
    assert "statutory_regime" in data
    assert len(data["items"]) >= 1

    new_item = {
        "item_number": 3,
        "schedule_type": "MG6C",
        "description": "Witness cell phone audio memo (unrelated traffic discussion)",
        "location_stored": "Digital Vault Storage Folder 9",
        "relevance_to_case": "General background inquiry",
        "undermines_prosecution": False,
        "assists_defense": False,
        "disclosure_decision": "DISCLOSE",
        "logged_by_badge": "DL-POL-IO-8812"
    }
    res_post = client.post("/api/v1/cases/FIR-2026-TRIAL-01/unused-material", json=new_item)
    assert res_post.status_code == 200
    assert res_post.json()["status"] == "SUCCESS"

def test_c3_officer_disciplinary_tracking_wiring():
    """C3: Verify officer history surfaces disciplinary and sustained complaint metrics."""
    res = client.get("/api/v1/officers/DL-POL-IO-8812/history")
    assert res.status_code == 200
    data = res.json()
    assert "badge_number" in data
    assert "conviction_rate_percent" in data
    assert "disciplinary_complaints" in data
    assert "sustained_complaints" in data
    assert "integrity_standing" in data

def test_c4_bank_sync_adapter_wiring():
    """C4: Verify Core Banking / Account Aggregator synchronization."""
    payload = {
        "account_number": "990145829104",
        "bank_name": "State Bank of India"
    }
    res = client.post("/api/v1/bank/sync", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["sync_status"] == "SYNCHRONIZED_SUCCESS"
    assert data["transactions_ingested"] >= 1
    assert "suspicious_patterns_detected" in data

def test_c5_stqc_certificate_generation_wiring():
    """C5: Verify STQC electronic evidence certificate PDF generation under Section 63 BSA."""
    res = client.get("/api/v1/legal/stqc/FIR-2026-BSA-8812")
    assert res.status_code == 200
    assert "application/pdf" in res.headers.get("content-type", "") or "text/plain" in res.headers.get("content-type", "")
    assert len(res.content) > 100

def test_c6_gdpr_review_status_case_model_wiring():
    """C6: Verify human_review_status column exists on Case model."""
    assert hasattr(Case, "human_review_status")
    db = SessionLocal()
    try:
        c = db.query(Case).first()
        if c:
            assert hasattr(c, "human_review_status")
    finally:
        db.close()

def test_c7_atf_etrace_export_wiring():
    """C7: Verify ATF Form 3312.1 / eTrace JSON packet export."""
    res = client.get("/api/v1/gun-intelligence/export/atf")
    assert res.status_code == 200
    data = res.json()
    assert "batch_header" in data
    assert "etrace_submissions" in data
    assert len(data["etrace_submissions"]) >= 1
    first_sub = data["etrace_submissions"][0]
    assert "firearm_characteristics" in first_sub
    assert "time_to_crime_analysis" in first_sub

def test_c8_ripa_validator_wiring():
    """C8: Verify RIPA 2000 / IPA 2016 4-part necessity and proportionality check."""
    payload = {
        "operation_name": "Operation Border Intercept",
        "statutory_ground": "PREVENTING_OR_DETECTING_SERIOUS_CRIME",
        "offense_severity": "CRITICAL",
        "less_intrusive_methods_exhausted": True,
        "bystander_masking_active": True,
        "duration_hours": 72
    }
    res = client.post("/api/v1/ripa/validate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_ripa_compliant"] is True
    assert data["decision"] == "AUTHORIZATION_CONFIRMED"
    assert data["compliance_score"] == 100.0
    assert len(data["passed_checks"]) == 4
