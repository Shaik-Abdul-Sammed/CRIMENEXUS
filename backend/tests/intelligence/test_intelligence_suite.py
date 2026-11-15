import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

FEATURE_SLUGS = [
    "intelligence-fusion",
    "risk-scoring",
    "hotspot-forecast",
    "sna-gangs",
    "rtcc",
    "route-analysis",
    "near-repeat",
    "forensics-db",
    "interpol-sync",
    "sar-analytics",
    "threat-assessment",
    "osint-monitor",
    "imsi-catcher",
    "gun-intelligence",
    "ibis",
    "dv-risk",
    "intercept-translate",
    "geofence",
    "blockchain-evidence",
    "case-triage"
]

@pytest.mark.parametrize("slug", FEATURE_SLUGS)
def test_all_20_features_health_endpoints(slug):
    """
    Verifies that all 20 International Police Intelligence endpoints
    return HTTP 200 and healthy status on their health check route.
    """
    response = client.get(f"/api/v1/{slug}/health")
    assert response.status_code == 200, f"Health check failed for feature '{slug}': {response.text}"
    data = response.json()
    assert data.get("status") in ["healthy", "OPERATIONAL"], f"Feature '{slug}' status not healthy: {data}"

def test_sprint_1_end_to_end():
    """Sprint 1 Integration: Intelligence Fusion & Risk Scoring & Gang SNA & RTCC."""
    res_fusion = client.post("/api/v1/intelligence/fusion-search", json={"query": "gang weapon", "entity_types": ["CASES"]})
    assert res_fusion.status_code == 200
    assert "grouped_results" in res_fusion.json()

    res_risk = client.get("/api/v1/risk-scoring/person/LB-01")
    assert res_risk.status_code == 200
    assert 0 <= res_risk.json()["risk_score"] <= 100

    res_sna = client.get("/api/v1/sna/gangs/GANG-NCR-01")
    assert res_sna.status_code == 200
    assert len(res_sna.json()["cut_points"]) > 0

    res_rtcc = client.get("/api/v1/rtcc/events")
    assert res_rtcc.status_code == 200
    assert "alerts" in res_rtcc.json()

def test_sprint_2_end_to_end():
    """Sprint 2 Integration: Route Analysis & Near-Repeat & Forensics DB & Interpol & SAR."""
    res_route = client.get("/api/v1/route-analysis/SUSP-DEL-8921")
    assert res_route.status_code == 200
    assert res_route.json()["crime_overlap_percentage"] >= 0

    res_nr = client.get("/api/v1/near-repeat/alerts?district=South%20Delhi")
    assert res_nr.status_code == 200
    assert "zones" in res_nr.json()

    res_forensics = client.get("/api/v1/forensics/records")
    assert res_forensics.status_code == 200

    res_interpol = client.get("/api/v1/interpol/notices")
    assert res_interpol.status_code == 200

    res_sar = client.get("/api/v1/sar/benchmark-cases")
    assert res_sar.status_code == 200

def test_sprint_3_end_to_end():
    """Sprint 3 Integration: Threat Assessment & OSINT & IMSI & Gun Intelligence & IBIS."""
    res_threat = client.get("/api/v1/threat-assessment/SUBJ-01")
    assert res_threat.status_code == 200

    res_osint = client.get("/api/v1/osint/alerts")
    assert res_osint.status_code == 200

    res_imsi = client.get("/api/v1/imsi/sessions")
    assert res_imsi.status_code == 200

    res_gun = client.get("/api/v1/gun-intelligence/traces")
    assert res_gun.status_code == 200

    res_ibis = client.get("/api/v1/ibis/specimens")
    assert res_ibis.status_code == 200

def test_sprint_4_end_to_end():
    """Sprint 4 Integration: DV Risk & Intercept Translate & Geofence & Blockchain & Triage."""
    res_dv = client.get("/api/v1/dv/questions")
    assert res_dv.status_code == 200

    res_intercept = client.get("/api/v1/intercept/slang-glossary")
    assert res_intercept.status_code == 200

    res_geo = client.get("/api/v1/geofence/warrants")
    assert res_geo.status_code == 200

    res_blockchain = client.get("/api/v1/blockchain/ledger")
    assert res_blockchain.status_code == 200

    res_triage = client.get("/api/v1/triage/queue")
    assert res_triage.status_code == 200
