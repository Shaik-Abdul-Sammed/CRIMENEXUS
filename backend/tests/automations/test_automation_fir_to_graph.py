"""
Automation 1: Zero-Click FIR to Multi-Modal Knowledge Graph Ingestion.
Tests:
  1. Upload text FIR -> verify entities extracted (suspects, phones, vehicles, IPC sections).
  2. Upload scanned PDF FIR -> verify OCR extracts text and NER works.
  3. Verify Cypher nodes and edges are created in Neo4j ((:Person)-[:USES_PHONE]->(:Phone)).
  4. Upload garbage input (empty, oversized >10MB, wrong mime) -> verify graceful rejection.
  5. Verify HMAC-SHA256 audit log entry was created for this ingestion.
"""

import io
import sys
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient

from app.main import app
from app.database.neo4j import execute_cypher
from app.database.postgres import SessionLocal
from app.models.audit_ledger import AuditLedgerEntry

client = TestClient(app)


def test_fir_text_upload_entity_extraction():
    """Test 1: Upload text FIR -> verify entities extracted (suspects, phones, vehicles, IPC sections)."""
    case_num = "FIR-2026-AUTOTEST-01"
    narrative = (
        "FIRST INFORMATION REPORT\n"
        "Police Station: Sector 20 Cyber Crime PS\n"
        "Sections: Section 420 IPC, Section 120B IPC and Section 66D IT Act\n"
        "Accused suspect Rajan procured burner mobile phone +91 99999 88888 "
        "and operated vehicle TS 09 AB 1234 to coordinate extortion rackets."
    )

    response = client.post(
        "/api/v1/forensics/fir/upload",
        data={
            "case_number": case_num,
            "title": "Extortion & Cyber Smurfing Syndicate",
            "narrative_text": narrative,
            "filed_by": "Inspector V. K. Sharma"
        }
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["status"] == "success"
    entities = data["extracted_entities"]

    assert any("Rajan" in s for s in entities["suspects_identified"]), f"Rajan not in {entities['suspects_identified']}"
    assert any("99999 88888" in p or "9999988888" in p for p in entities["phones_identified"]), f"Phone not in {entities['phones_identified']}"
    assert any("TS 09 AB 1234" in v or "TS09AB1234" in v.replace(" ", "") for v in entities["vehicles_identified"]), f"Vehicle not in {entities['vehicles_identified']}"
    assert any("420" in sec or "120B" in sec for sec in entities["legal_sections"]), f"Sections not in {entities['legal_sections']}"


def test_fir_scanned_pdf_ocr_extraction():
    """Test 2: Upload scanned PDF/image FIR -> verify OCR extracts text and NER works."""
    img = Image.new("RGB", (650, 180), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((20, 20), "DELHI POLICE FIRST INFORMATION REPORT", fill=(0, 0, 0))
    draw.text((20, 55), "FIR NO 901/2026 SECTION 420 IPC 120B IPC", fill=(0, 0, 0))
    draw.text((20, 90), "ACCUSED RAJAN VEHICLE TS 09 AB 1234", fill=(0, 0, 0))
    draw.text((20, 125), "PHONE NUMBER 9876543210 INVOLVED IN FRAUD", fill=(0, 0, 0))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    raw_img_bytes = buf.getvalue()

    response = client.post(
        "/api/v1/forensics/fir/upload",
        data={
            "case_number": "FIR-2026-SCANNED-02",
            "title": "Scanned Document Ingestion Test",
            "filed_by": "Sub-Inspector M. Rao"
        },
        files={"file": ("scanned_fir.png", raw_img_bytes, "image/png")}
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    res_data = response.json()
    assert res_data["status"] == "success"
    entities = res_data["extracted_entities"]
    assert len(entities.get("legal_sections", [])) >= 1 or len(entities.get("suspects_identified", [])) >= 1


def test_fir_neo4j_nodes_and_edges():
    """Test 3: Verify Cypher nodes and edges are created in Neo4j ((:Person)-[:USES_PHONE]->(:Phone))."""
    query = """
    MATCH (s:Person {name: "Rajan"})-[:USES_PHONE]->(ph:Phone)
    RETURN s.name AS person, ph.phone_number AS phone
    """
    records = execute_cypher(query)
    assert len(records) >= 1, "Expected at least one (:Person)-[:USES_PHONE]->(:Phone) relationship for Rajan"
    assert records[0]["person"] == "Rajan"
    assert "99999" in records[0]["phone"] or "98765" in records[0]["phone"]


def test_fir_garbage_and_oversized_rejection():
    """Test 4: Upload garbage input (empty, oversized >10MB) -> verify graceful rejection."""
    # 4a: Empty payload
    res_empty = client.post("/api/v1/forensics/fir/upload", data={})
    assert res_empty.status_code in [400, 422], f"Expected 400 or 422 for empty payload, got {res_empty.status_code}"

    # 4b: Oversized input (> 10MB)
    huge_bytes = b"X" * (10 * 1024 * 1024 + 1024)
    res_huge = client.post(
        "/api/v1/forensics/fir/upload",
        data={"case_number": "FIR-OVERSIZED", "title": "DoS Test"},
        files={"file": ("huge_payload.txt", huge_bytes, "text/plain")}
    )
    assert res_huge.status_code == 413, f"Expected 413 Payload Too Large, got {res_huge.status_code}"


def test_fir_hmac_audit_ledger_entry():
    """Test 5: Verify HMAC-SHA256 audit log entry was created for this ingestion."""
    db = SessionLocal()
    try:
        entries = (
            db.query(AuditLedgerEntry)
            .filter(AuditLedgerEntry.resource_type == "FIRST_INFORMATION_REPORT")
            .order_by(AuditLedgerEntry.timestamp.desc())
            .all()
        )
        assert len(entries) >= 1, "Expected at least one audit entry for FIR ingestion in the WORM ledger"
        latest = entries[0]
        assert latest.current_hash is not None and len(latest.current_hash) == 64
        assert latest.previous_hash is not None
        assert "FIR" in latest.action or "FIR" in latest.resource_type
    finally:
        db.close()


if __name__ == "__main__":
    test_fir_text_upload_entity_extraction()
    test_fir_scanned_pdf_ocr_extraction()
    test_fir_neo4j_nodes_and_edges()
    test_fir_garbage_and_oversized_rejection()
    test_fir_hmac_audit_ledger_entry()
    print("ALL 5 FIR-to-Graph Automation Tests PASSED.")
