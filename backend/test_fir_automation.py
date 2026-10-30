import io
import sys
import json
import logging
from fastapi.testclient import TestClient

from app.main import app
from app.database.neo4j import execute_cypher

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_fir_automation")


def test_zero_click_fir_to_graph_linkage():
    client = TestClient(app)

    print("\n" + "=" * 80)
    print("STEP 5: AUTOMATION 1 - ZERO-CLICK FIR-TO-GRAPH LINKAGE VERIFICATION")
    print("=" * 80)

    # 1. State Before FIR Ingestion
    print("\n[1] Checking Pre-Ingestion Graph State for Suspect 'Rajan'...")
    pre_query = """
    MATCH (s:Person {name: "Rajan"})-[r]-(target)
    RETURN s.name AS suspect, type(r) AS rel_type, labels(target)[0] AS target_type,
           coalesce(target.name, target.phone_number, target.plate_number, target.account_number) AS target_identifier
    """
    pre_results = execute_cypher(pre_query)
    print(f"Existing Relationships for Rajan ({len(pre_results)} found):")
    for row in pre_results:
        print(f"  - (Rajan)-[:{row['rel_type']}]->({row['target_type']}: {row['target_identifier']})")

    # 2. Simulated FIR Text Content
    fir_case_number = "FIR-2026-CRIME-890"
    fir_title = "Illicit Hawala Financial Network & Threat Operations"
    fir_narrative = (
        "FIRST INFORMATION REPORT (FIR No. 2026/890)\n"
        "Police Station: Sector 20 Cyber Crime PS, Gautam Buddha Nagar\n"
        "Sections: Section 420, 120B IPC and Section 66D IT Act\n\n"
        "INCIDENT NARRATIVE:\n"
        "Credible intelligence received indicates that Accused Rajan has procured a new burner SIM "
        "with phone number +91 99999 88888 to coordinate clandestine hawala cash transfers and extortion. "
        "On 29-10-2026, suspect Rajan was sighted operating vehicle TS 09 AB 1234 near Sector 62. "
        "The newly activated phone +91 99999 88888 received encrypted dispatch instructions."
    )

    print("\n[2] Submitting FIR Document to Ingestion Endpoint (/api/v1/forensics/fir/upload)...")
    # Simulate file upload with UTF-8 text file payload
    file_bytes = fir_narrative.encode("utf-8")
    files = {
        "file": ("fir_report_890.txt", io.BytesIO(file_bytes), "text/plain")
    }
    data = {
        "case_number": fir_case_number,
        "title": fir_title,
        "filed_by": "Inspector V. K. Sharma (Special Cell)"
    }

    response = client.post("/api/v1/forensics/fir/upload", data=data, files=files)
    print(f"HTTP Response Status Code: {response.status_code}")
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    result = response.json()
    print("Ingestion Response Summary:")
    print(json.dumps(result, indent=2))

    # 3. Assertions on NLP Extracted Entities
    extracted = result.get("extracted_entities", {})
    suspects = extracted.get("suspects_identified", [])
    phones = extracted.get("phones_identified", [])
    vehicles = extracted.get("vehicles_identified", [])

    print("\nExtracted Entities Assertions:")
    print(f"  Suspects Identified: {suspects}")
    print(f"  Phones Identified:   {phones}")
    print(f"  Vehicles Identified: {vehicles}")

    assert "Rajan" in suspects, f"'Rajan' was not identified in suspects: {suspects}"
    assert any("99999 88888" in p or "9999988888" in p for p in phones), f"New phone not found in: {phones}"

    # 4. Neo4j Graph Verification
    print("\n[3] Verifying Automated Graph Linkage in Neo4j via Parameterized Cypher Query...")
    verify_query = """
    MATCH (s:Person {name: $suspect_name})-[r:USES_PHONE]->(ph:Phone)
    WHERE ph.phone_number = $expected_phone OR ph.phone_number CONTAINS "99999"
    RETURN s.name AS suspect, type(r) AS relationship, ph.phone_number AS phone_number, properties(r) AS properties
    """
    verify_params = {
        "suspect_name": "Rajan",
        "expected_phone": "+91 99999 88888"
    }
    graph_results = execute_cypher(verify_query, verify_params)

    print(f"Direct Neo4j Cypher Query Matches: {len(graph_results)}")
    for record in graph_results:
        print(f"  MATCH CONFIRMED: (:{record['suspect']})-[:{record['relationship']} {record['properties']}]->(:Phone {record['phone_number']})")

    assert len(graph_results) > 0, "FAILED: No USES_PHONE edge between Rajan and +91 99999 88888 was found in Neo4j!"

    # 5. Full Updated Network of Rajan
    print("\n[4] Complete Post-Ingestion Network Graph for Suspect 'Rajan':")
    post_query = """
    MATCH (s:Person {name: "Rajan"})-[r]-(target)
    RETURN s.name AS suspect, type(r) AS rel_type, labels(target)[0] AS target_type,
           coalesce(target.name, target.phone_number, target.plate_number, target.account_number, target.case_number) AS target_identifier
    """
    post_results = execute_cypher(post_query)
    for row in post_results:
        print(f"  -> (Rajan)-[:{row['rel_type']}]->({row['target_type']}: {row['target_identifier']})")

    print("\n" + "=" * 80)
    print("SUCCESS: Automation 1 (Zero-Click FIR-to-Graph Linkage) Verified End-to-End!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    try:
        test_zero_click_fir_to_graph_linkage()
        sys.exit(0)
    except AssertionError as ae:
        print(f"\nASSERTION ERROR: {ae}", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"\nUNEXPECTED ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
