"""
Police Workflow Scenario 4: Inter-State Fugitive Tracking & Lookout Circular (LOC).
Workflow:
  1. Suspect "Rajan" commits armed crime in Delhi and flees to Bengaluru.
  2. IO triggers CCTNS / ICJS inter-state query to uncover prior offenses.
  3. CCTNS Adapter returns out-of-state priors (Delhi FIRs, history sheet, active chargesheets).
  4. CCTNS synchronization writes unified entity graph into Neo4j connecting disparate state records.
  5. System auto-drafts Ministry of Home Affairs Lookout Circular (LOC) for Bureau of Immigration / ICPs.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.services.external.cctns_adapter import get_cctns_adapter
from app.database.neo4j import execute_cypher

client = TestClient(app)


def test_scenario_cross_state_fugitive_investigation():
    suspect_name = "Rajan"
    suspect_phone = "+919999988888"
    delhi_fir = "FIR-2026-DEL-8902"

    # 1. Query ICJS for inter-state criminal priors
    icjs_res = client.get(f"/api/v1/external/icjs/priors?name={suspect_name}")
    assert icjs_res.status_code == 200, f"ICJS query failed: {icjs_res.text}"
    icjs_data = icjs_res.json()
    assert icjs_data["matches_found"] >= 1
    assert any(delhi_fir in str(rec) or "FIR" in str(rec) for rec in icjs_data["records"])

    # 2. Query CCTNS Adapter directly for national multi-state dossier
    adapter = get_cctns_adapter()
    lookup = adapter.lookup_interstate_suspect(suspect_phone)
    assert lookup["matched"] is True
    assert lookup["suspect_name"] == suspect_name
    assert lookup["danger_rating"] == "EXTREME FLIGHT RISK"
    assert len(lookup["registered_firs"]) >= 2
    assert "TS 09 AB 1234" in lookup["linked_vehicles"]

    # 3. Synchronize CCTNS FIR into local police grid (PostgreSQL + Neo4j)
    sync_res = client.post(f"/api/v1/external/cctns/sync/{delhi_fir}")
    assert sync_res.status_code == 200
    assert sync_res.json().get("synced_into_databases") is True

    # 4. Ingest Bengaluru fugitive sighting connecting to existing suspect in graph
    sighting_cypher = """
    MERGE (p:Person {name: $name})
    MERGE (loc:Location {name: "Kempegowda International Airport, Bengaluru", state: "Karnataka"})
    MERGE (p)-[:SIGHTED_IN {timestamp: datetime(), alert: "INTERSTATE_FUGITIVE"}]->(loc)
    RETURN p.name as suspect, loc.state as state
    """
    records = execute_cypher(sighting_cypher, {"name": suspect_name})
    assert len(records) >= 1

    # Verify cross-state link in Neo4j (Delhi case linked to Bengaluru sighting)
    cross_state_check = """
    MATCH (c:Case {case_number: $case_id})<-[:ACCUSED_IN]-(p:Person {name: $name})-[:SIGHTED_IN]->(loc:Location)
    RETURN c.case_number as case_num, p.name as suspect, loc.state as sighting_state
    """
    linked = execute_cypher(cross_state_check, {"case_id": delhi_fir, "name": suspect_name})
    assert len(linked) >= 1
    assert linked[0]["sighting_state"] == "Karnataka"

    # 5. AI Legal Drafting: Auto-draft Ministry of Home Affairs Lookout Circular (LOC)
    loc_res = client.post(
        f"/api/v1/draft/lookout-circular/{suspect_name}",
        json={"identification": "Indian Passport G-9812401 / Aadhaar 9988-1122-3344"}
    )
    assert loc_res.status_code == 200, f"LOC draft failed: {loc_res.text}"
    loc_data = loc_res.json()
    draft_text = loc_data.get("draft_text", "")
    draft_upper = draft_text.upper()
    assert suspect_name.upper() in draft_upper
    assert "LOOKOUT CIRCULAR" in draft_upper or "LOC" in draft_upper
    assert "BUREAU OF IMMIGRATION" in draft_upper or "IMMIGRATION" in draft_upper
    assert "MINISTRY OF HOME AFFAIRS" in draft_upper or "DETAIN" in draft_upper
