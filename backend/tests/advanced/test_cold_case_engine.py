import pytest
from app.ml_service.cold_case_engine import (
    resurrect_cold_cases,
    _compute_mo_similarity
)

def test_cold_case_exact_phone_and_alias_hit():
    new_arrest = {
        "suspect_name": "Aslam Khan",
        "aliases": ["Kala Pathan"],
        "phones": ["+919820011223"],
        "mo_summary": "Attempted bank break in using gas torch cutter"
    }
    
    matches = resurrect_cold_cases(new_arrest)
    assert len(matches) >= 1
    top_hit = matches[0]
    assert top_hit["cold_case_id"] == "COLD-2021-0812"
    assert top_hit["resurrection_confidence"] >= 0.50
    assert any("Phone match" in ind for ind in top_hit["matched_indicators"])
    assert any("Alias match" in ind for ind in top_hit["matched_indicators"])
    assert "production warrant" in top_hit["reopen_recommendation"]


def test_cold_case_mo_semantic_overlap():
    new_fir = {
        "phones": ["+919999999999"],
        "mo_summary": "Electricity bill disconnection fraud message sent to elder citizens"
    }
    
    matches = resurrect_cold_cases(new_fir)
    cyber_match = next((m for m in matches if m["cold_case_id"] == "COLD-2022-1405"), None)
    assert cyber_match is not None
    assert any("Modus Operandi similarity" in ind for ind in cyber_match["matched_indicators"])


def test_no_matches_for_unrelated_crime():
    unrelated_case = {
        "phones": ["+911122334455"],
        "vehicles": ["DL-10-ZZ-0001"],
        "aliases": ["Unknown Pickpocket"],
        "mo_summary": "Bus stop snatching of purse"
    }
    matches = resurrect_cold_cases(unrelated_case)
    assert len(matches) == 0
