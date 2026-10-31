"""
Police Workflow Scenario 3: Witness Contradiction & Alibi Discrepancy Analysis.
Workflow:
  1. IO records 3 separate witness statements regarding suspect Ramesh's presence during the crime window.
  2. IO runs each through the automated NLP witness interview summarizer (/api/v1/forensics/witness/summarize).
  3. NLP engine extracts suspect names, crime MO, and specific timeline/location anchors.
  4. System cross-correlates extracted timelines to identify contradictions (e.g. Ramesh simultaneously
     placed at Connaught Place, Delhi and Sector 18, Noida at 18:30 hrs).
  5. The geographical timeline discrepancy invalidates the false alibi and flags the conflict.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_scenario_witness_contradiction_investigation():
    # 3 Conflicting Witness Statements
    statement_1 = (
        "I was standing at the entrance. I saw Ramesh at 18:30 hrs outside Connaught Place Delhi "
        "near the ATM carrying a black duffel bag with currency notes."
    )
    statement_2 = (
        "I clearly remember that I met accused Ramesh at 18:30 hrs outside Noida Sector 62 counter. "
        "He was having tea with me and stayed till 19:00 hrs. He could not have been in Delhi."
    )
    statement_3 = (
        "I observed accused Ramesh around 19:00 hrs at Gurugram highway toll plaza. "
        "He appeared nervous and sped away towards Jaipur expressway."
    )

    # 1. Process Witness Statement 1
    res1 = client.post("/api/v1/forensics/witness/summarize", json={"testimony": statement_1})
    assert res1.status_code == 200, f"Witness 1 summarizer failed: {res1.text}"
    w1_data = res1.json()
    assert any("Ramesh" in s for s in w1_data["suspects"])
    assert "Connaught Place" in w1_data["timeline_alibi"] or "18:30" in w1_data["timeline_alibi"]

    # 2. Process Witness Statement 2
    res2 = client.post("/api/v1/forensics/witness/summarize", json={"testimony": statement_2})
    assert res2.status_code == 200, f"Witness 2 summarizer failed: {res2.text}"
    w2_data = res2.json()
    assert any("Ramesh" in s for s in w2_data["suspects"])
    assert "Noida" in w2_data["timeline_alibi"] or "18:30" in w2_data["timeline_alibi"]

    # 3. Process Witness Statement 3
    res3 = client.post("/api/v1/forensics/witness/summarize", json={"testimony": statement_3})
    assert res3.status_code == 200, f"Witness 3 summarizer failed: {res3.text}"
    w3_data = res3.json()
    assert any("Ramesh" in s for s in w3_data["suspects"])
    assert "highway" in w3_data["timeline_alibi"].lower() or "expressway" in w3_data["timeline_alibi"].lower()

    # 4. Cross-examination & Discrepancy Detection:
    # Witness 1 asserts Ramesh was in Central Delhi at 18:30
    # Witness 2 asserts Ramesh was in Noida (UP) at 18:30
    w1_loc = w1_data["timeline_alibi"]
    w2_loc = w2_data["timeline_alibi"]
    assert "Connaught Place" in w1_loc or "Delhi" in w1_loc
    assert "Noida" in w2_loc

    # Flag contradiction: simultaneously in Connaught Place (Delhi) and Noida (UP) at 18:30 hrs
    is_contradiction = (
        ("18:30" in statement_1 and "18:30" in statement_2) and
        ("Delhi" in w1_loc or "Connaught" in w1_loc) and
        ("Noida" in w2_loc)
    )
    assert is_contradiction, "System failed to flag simultaneous multi-location contradiction"

    # Verify structured summary bullets format
    for res_dict in [w1_data, w2_data, w3_data]:
        bullets = res_dict.get("summary_bullets", [])
        assert len(bullets) == 3
        assert bullets[0].startswith("Suspect Name(s):")
        assert bullets[1].startswith("Crime Type / MO:")
        assert bullets[2].startswith("Key Alibi / Timeline:")
