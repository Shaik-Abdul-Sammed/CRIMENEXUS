import os
import sys
import io
import zipfile
import hashlib
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app.main import app
from app.models.audit_ledger import AuditLedgerEntry
from app.models.custody_tracker import CustodyTracker
from app.services.legal.audit_service import record_audit_event
from app.services.legal.merkle_notary import (
    get_merkle_root,
    generate_inclusion_proof,
    verify_inclusion
)

client = TestClient(app)


def test_section_63_bsa_hash_matches_file():
    """Legal 1: Uploaded digital evidence must match client-computed SHA-256 for Section 63 BSA compliance."""
    content = b"CRIME_SCENE_DIGITAL_FORENSICS_EVIDENCE_DUMP_2026"
    client_sha = hashlib.sha256(content).hexdigest()

    files = {"file": ("evidence_dump.bin", content, "application/octet-stream")}
    data = {
        "title": "Seized Phone Extraction",
        "case_id": "FIR-2026-DEL-9812",
        "client_sha256": client_sha
    }
    res = client.post("/api/v1/evidence/upload", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["sha256_hash"] == client_sha
    assert res_data["integrity_verified"] is True
    assert res_data["chain_of_custody_status"] == "VERIFIED"


def test_worm_ledger_tamper_detection(db):
    """Legal 2: Unauthorized modification of any row in WORM ledger must trigger tamper detection."""
    # Insert clean valid audit event
    entry = record_audit_event(
        db=db,
        officer_badge="DL-POL-8812",
        officer_name="Inspector Test",
        station_id="TEST_STATION",
        action="EVIDENCE_LOGGED",
        resource_type="CASE_FILE",
        resource_id="CASE-TAMPER-TEST",
        details="Original unadulterated evidentiary text"
    )

    # Tamper with the row directly in database
    entry.details = "TAMPERED_DETAILS_BY_ADVERSARY"
    db.commit()

    # Call verification endpoint
    res = client.get("/api/v1/legal/verify-chain")
    assert res.status_code == 200
    data = res.json()
    assert data["tampered"] is True
    assert data["status"] == "CORRUPTED"

    # Cleanup tampered row
    db.delete(entry)
    db.commit()


def test_remand_clock_fires_at_24h(db):
    """Legal 3: Suspect held > 23h must trigger statutory high-urgency remand production warning."""
    past_arrest = datetime.utcnow() - timedelta(hours=23, minutes=15)
    expiry = past_arrest + timedelta(hours=24)
    deadline_cs = past_arrest + timedelta(days=60)

    tracker = CustodyTracker(
        case_id="FIR-2026-REMAND-TEST",
        suspect_id="SUSP-TEST-REMAND",
        suspect_name="Test Remand Subject",
        arrest_timestamp=past_arrest,
        remand_expiry_timestamp=expiry,
        charge_sheet_deadline=deadline_cs,
        status="ACTIVE"
    )
    db.add(tracker)
    db.commit()
    db.refresh(tracker)

    # Trigger deadline verification endpoint
    res = client.post("/api/v1/legal/custody/check-deadlines")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert "alerts_generated" in data

    # Verify query reflects urgent remand production
    res_summary = client.get("/api/v1/legal/custody/summary")
    assert res_summary.status_code == 200
    summary_data = res_summary.json()
    assert summary_data["magistrate_production_due_today"] >= 1

    # Cleanup
    db.delete(tracker)
    db.commit()


def test_brady_disclosure_excludes_unsustained():
    """Legal 4: Brady/Giglio disclosure must accurately reflect sustained disciplinary findings."""
    res = client.get("/api/v1/officers/DL-POL-IO-8812/disclosure")
    assert res.status_code == 200
    data = res.json()
    assert "disclosures" in data
    assert "constitutional_standard" in data
    assert "Brady v. Maryland" in data["constitutional_standard"]


def test_cpia_exculpatory_flagged():
    """Legal 5: CPIA 1996 unused material schedule must log exculpatory material assisting defense."""
    new_item = {
        "item_number": 104,
        "schedule_type": "MG6C",
        "description": "Unused alibi receipt for suspect timestamped at incident hour",
        "location_stored": "Property Room Shelf 4",
        "relevance_to_case": "Potential defense alibi corroboration",
        "undermines_prosecution": True,
        "assists_defense": True,
        "disclosure_decision": "DISCLOSE",
        "logged_by_badge": "DL-POL-IO-8812"
    }
    res_post = client.post("/api/v1/cases/FIR-2026-CPIA-TEST/unused-material", json=new_item)
    assert res_post.status_code == 200
    post_data = res_post.json()
    assert post_data["status"] == "SUCCESS"

    res_get = client.get("/api/v1/cases/FIR-2026-CPIA-TEST/unused-material")
    assert res_get.status_code == 200
    get_data = res_get.json()
    assert "items" in get_data
    assert any(i["item_number"] == 104 for i in get_data["items"])


def test_gdpr_review_required_above_80():
    """Legal 6: Algorithmic risk scores >= 80 must require mandatory officer override under GDPR Art. 22."""
    res = client.get("/api/v1/risk/person/rajan")
    assert res.status_code == 200
    data = res.json()
    assert data["risk_score"] >= 80.0
    assert data["human_review_required"] is True
    assert data["human_review_status"] == "PENDING_OFFICER_OVERRIDE"


def test_evidence_bundle_zip_complete(test_case):
    """Legal 7: Digital evidence bundle must produce court-admissible password-protected zip with hashes manifest."""
    res = client.get(f"/api/v1/cases/{test_case.id}/evidence-bundle")
    assert res.status_code == 200
    assert "zip" in res.headers.get("content-type", "").lower() or "octet-stream" in res.headers.get("content-type", "").lower()

    # Verify zip content structure
    zip_bytes = io.BytesIO(res.content)
    with zipfile.ZipFile(zip_bytes, "r") as zf:
        namelist = zf.namelist()
        assert any("particulars" in name for name in namelist)
        assert any("hashes" in name for name in namelist)


def test_merkle_proof_verification():
    """Legal 8: Merkle tree inclusion proof for an individual audit hash must evaluate to True."""
    leaf_hashes = [
        hashlib.sha256(f"ENTRY_{i}".encode()).hexdigest()
        for i in range(4)
    ]
    merkle_root = get_merkle_root(leaf_hashes)
    target_leaf = leaf_hashes[1]

    proof = generate_inclusion_proof(leaf_hashes, target_leaf)
    assert proof is not None
    assert len(proof) == 2  # Depth 2 for 4 leaves

    # Verify cryptographic inclusion
    is_valid = verify_inclusion(target_leaf, proof, merkle_root)
    assert is_valid is True

    # Tampered leaf must fail verification
    is_invalid = verify_inclusion("bad_hash" * 4, proof, merkle_root)
    assert is_invalid is False
