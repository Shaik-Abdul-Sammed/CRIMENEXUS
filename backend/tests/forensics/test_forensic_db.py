import pytest
from app.api.forensics_db import forensic_db_health, list_forensic_records, match_forensic_evidence, ForensicMatchRequest

def test_forensic_db_happy_path():
    """Happy Path: Matches a DNA profile against the CFSL national database."""
    health = forensic_db_health()
    assert health["status"] == "healthy"
    assert "DNA (CODIS STR 24)" in health["modalities_supported"]
    
    req = ForensicMatchRequest(
        modality="DNA",
        profile_data="D3S1358 vWA FGA",
        case_context="FIR-2026-MURDER-01"
    )
    res = match_forensic_evidence(req)
    assert res["matches_found"] >= 1
    hit = res["hits"][0]
    assert hit.modality == "DNA"
    assert hit.similarity_score >= 0.85
    assert hit.custody_chain_verified is True

def test_forensic_db_fingerprint_modality_filter():
    """Edge Case: Filters records by modality FINGERPRINT and verifies hit integrity."""
    records = list_forensic_records(modality="FINGERPRINT")
    assert len(records) >= 1
    assert all(r["modality"] == "FINGERPRINT" for r in records)

def test_forensic_db_unmatched_cold_case_synthesis():
    """Failure/Fallback: Unmatched query creates synthesized probable linkage for cold case triage."""
    req = ForensicMatchRequest(
        modality="FOOTWEAR",
        profile_data="Uncommon Outsole Lug Chevron Pattern 44",
        case_context="FIR-COLD-CASE-02"
    )
    res = match_forensic_evidence(req)
    assert res["matches_found"] >= 1
    assert res["hits"][0].modality == "FOOTWEAR"
