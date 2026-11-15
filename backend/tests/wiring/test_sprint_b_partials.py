import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_b1_hotspot_forecaster_wiring():
    """B1: Verify micro-hotspots forecast returns spatial probabilities and patrol recommendations."""
    res = client.get("/api/v1/forecast/hotspots?district=DELHI_CENTRAL&days_ahead=2")
    assert res.status_code == 200
    data = res.json()
    assert "hotspots" in data
    assert len(data["hotspots"]) >= 3
    assert data["model_engine"] in ["xgboost", "fallback_poisson"]
    first_hs = data["hotspots"][0]
    assert "latitude" in first_hs
    assert "longitude" in first_hs
    assert "predicted_probability" in first_hs
    assert "risk_tier" in first_hs
    if data["model_engine"] == "xgboost":
        assert all("predicted_probability" in h for h in data["hotspots"])


def test_b1_hotspot_forecaster_xgboost():
    """B1.2: Verify Hotspot Forecaster XGBoost endpoint integration."""
    response = client.get("/api/v1/hotspot-forecast?district=Delhi&date=2026-11-14")
    assert response.status_code == 200
    data = response.json()
    assert data["model_engine"] in ["xgboost", "fallback_poisson"]
    assert len(data["hotspots"]) > 0
    if data["model_engine"] == "xgboost":
        assert all("predicted_probability" in h for h in data["hotspots"])

def test_b2_sna_gang_cutpoints_wiring():
    """B2: Verify SNA NetworkX analysis identifies articulation points (cut-points)."""
    res = client.get("/api/v1/sna/gangs/GANG-NCR-01")
    assert res.status_code == 200
    data = res.json()
    assert "network_metrics" in data
    assert "cut_points" in data
    assert "removal_impact" in data
    assert len(data["cut_points"]) >= 1

def test_b3_route_awareness_space_wiring():
    """B3: Verify Brantingham awareness space corridors and directional bias."""
    res = client.get("/api/v1/route-analysis/SUSPECT-OFFENDER-01")
    assert res.status_code == 200
    data = res.json()
    assert "corridors" in data
    assert "directional_bias" in data
    assert "crimes_analyzed" in data


def test_b3_route_analysis_voronoi():
    """B3.2: Verify Scipy Voronoi crime scene spatial partitioning."""
    response = client.get("/api/v1/route-analysis")
    assert response.status_code == 200
    data = response.json()
    assert data["model_engine"] in ["scipy_voronoi", "fallback_projection", "insufficient_data"]
    if data["model_engine"] == "scipy_voronoi":
        assert "voronoi_vertices" in data
        assert len(data["assignments"]) >= 0

def test_b4_near_repeat_alerts_wiring():
    """B4: Verify Knox 400m / 14-day near-repeat contagion calculations."""
    res = client.get("/api/v1/near-repeat/alerts?district=South%20Delhi&window_days=14")
    assert res.status_code == 200
    data = res.json()
    assert "active_contagion_zones" in data
    assert "total_active_zones" in data

def test_b5_sar_analytics_wiring():
    """B5: Verify FIU-IND SAR structuring detection and benchmark cases."""
    res_bench = client.get("/api/v1/sar/benchmark-cases")
    assert res_bench.status_code == 200
    cases = res_bench.json()
    assert len(cases) >= 1

    analyze_payload = {
        "suspect_id": "SUSP-MULE-4412",
        "entity_name": "Test Trading Entity",
        "transactions": [
            {"id": "TX-01", "amount": 49000.0, "sender_account": "ACC1", "receiver_account": "ACC2", "velocity_minutes": 5},
            {"id": "TX-02", "amount": 48500.0, "sender_account": "ACC1", "receiver_account": "ACC3", "velocity_minutes": 8}
        ]
    }
    res_analyze = client.post("/api/v1/sar/analyze", json=analyze_payload)
    assert res_analyze.status_code == 200
    sar_data = res_analyze.json()
    assert sar_data["structuring_detected"] is True
    assert sar_data["mule_layering_detected"] is True
    assert sar_data["risk_tier"] in ("CRITICAL", "HIGH")

def test_b6_dv_risk_assessment_wiring():
    """B6: Verify Campbell Danger Assessment lethality scoring."""
    res_q = client.get("/api/v1/dv/questions")
    assert res_q.status_code == 200
    assert len(res_q.json()) == 10

    payload = {
        "case_id": "FIR-2026-DV-01",
        "victim_alias": "Protected Victim A",
        "affirmed_question_ids": ["DA_01", "DA_02", "DA_03", "DA_04"],
        "children_involved": True
    }
    res_assess = client.post("/api/v1/dv/assess", json=payload)
    assert res_assess.status_code == 200
    data = res_assess.json()
    assert data["lethality_score"] >= 40.0
    assert "risk_tier" in data

def test_b7_threat_assessment_trap18_wiring():
    """B7: Verify TRAP-18 targeted violence prevention scoring with RAG precedents."""
    res_meta = client.get("/api/v1/threat/framework-metadata")
    assert res_meta.status_code == 200

    payload = {
        "subject_id": "SUBJ-TERROR-THREAT-01",
        "subject_name": "Radicalized Operative",
        "active_proximal_ids": ["PROX_01", "PROX_02", "PROX_06"],
        "active_distal_ids": ["DIST_01", "DIST_08"],
        "narrative": "Subject reconned high-value public gathering."
    }
    res = client.post("/api/v1/threat/assess", json=payload)
    assert res.status_code == 200
    threat_data = res.json()
    assert threat_data["threat_index"] > 0
    assert "rag_statutory_precedents" in threat_data

def test_b8_intercept_translation_wiring():
    """B8: Verify underworld argot decoding into court-admissible translation."""
    res_glossary = client.get("/api/v1/intercept/slang-glossary")
    assert res_glossary.status_code == 200
    assert "ghoda" in res_glossary.json()

    payload = {
        "transcript": "Bhai ne bola do ghoda safehouse bhejo aur ek khoka nikalo.",
        "source_language": "HINDI_BAMBAIYA_ARGOT",
        "case_id": "FIR-2026-INTERCEPT-99"
    }
    res = client.post("/api/v1/intercept/translate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["slang_detected_count"] >= 2
    assert "translated_transcript" in data
    assert data["engine"] in ["whisper", "fallback_glossary"]

def test_b9_fairness_auditor_wiring():
    """B9: Verify Algorithmic Fairness & Disparate Impact Ratio (DIR) compliance."""
    res = client.get("/api/v1/risk-scoring/fairness-audit")
    assert res.status_code == 200
    data = res.json()
    assert "disparate_impact_threshold" in data
    assert data["disparate_impact_threshold"] == 0.80
    assert "overall_equity_status" in data

def test_b10_and_b11_gdpr_art22_human_review_wiring():
    """B10 & B11: Verify GDPR Art. 22 Human-in-the-Loop gate >= 80 and officer override."""
    res = client.get("/api/v1/risk-scoring/person/PERSON-VK-01")
    assert res.status_code == 200
    person_data = res.json()
    assert person_data["risk_score"] >= 80.0
    assert person_data["human_review_required"] is True
    assert person_data["human_review_status"] == "PENDING_OFFICER_OVERRIDE"

    override_payload = {
        "officer_badge": "DL-DCP-SUPERVISOR-01",
        "officer_name": "DCP Crime Branch",
        "decision": "APPROVED_FOR_ACTION",
        "justification": "Reviewed independent wiretap and physical surveillance evidence; score affirmed."
    }
    res_override = client.post("/api/v1/risk-scoring/person/PERSON-VK-01/human-review", json=override_payload)
    assert res_override.status_code == 200
    assert res_override.json()["human_review_status"] == "APPROVED_FOR_ACTION"
