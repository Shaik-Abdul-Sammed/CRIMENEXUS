import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ml_service.rag_engine import get_rag_engine

client = TestClient(app)


def test_rag_draft_fir_direct():
    """Verify that draft_fir() returns a valid draft containing the suspect name and legal section."""
    engine = get_rag_engine()
    narrative = (
        "Complainant reported large illegal transfers. Accused suspect Rajan operating vehicle TS 09 AB 1234 "
        "defrauded multiple victims under Section 111 BNS and Section 420 IPC by running a smurfing racket."
    )
    result = engine.draft_fir(narrative)

    assert result["status"] == "success"
    assert "fir_number" in result
    assert "draft_text" in result
    draft = result["draft_text"]

    # Verify suspect name and legal sections appear in draft
    assert "Rajan" in draft or "Rajan" in result["suspects"]
    assert any(sec in draft for sec in ["111", "420", "318", "BNS", "IPC"])
    assert "FIRST INFORMATION REPORT" in draft or "FIR" in draft


def test_rag_draft_charge_sheet_direct():
    """Verify automated charge sheet generation with prosecution exhibits."""
    engine = get_rag_engine()
    result = engine.draft_charge_sheet(case_id="FIR-2026-DEL-9901", accused_name="Rajan")
    assert result["status"] == "success"
    assert "charge_sheet_number" in result
    assert "Rajan" in result["draft_text"]
    assert "Section 193" in result["draft_text"] or "Section 173" in result["draft_text"]
    assert "Exhibit P-1" in result["draft_text"]


def test_rag_draft_bank_freeze_notice():
    """Verify Section 102 CrPC / Sec 106 BNSS bank freeze notice draft."""
    engine = get_rag_engine()
    result = engine.draft_bank_freeze_notice(account_number="112233445566", bank_name="HDFC Bank")
    assert result["status"] == "success"
    assert "112233445566" in result["draft_text"]
    assert "102 Cr.P.C" in result["draft_text"] or "106 BNSS" in result["draft_text"]
    assert "DEBIT FREEZE" in result["draft_text"]


def test_rag_draft_lookout_circular():
    """Verify Lookout Circular (LOC) proforma for immigration control."""
    engine = get_rag_engine()
    result = engine.draft_lookout_circular(suspect_name="Rajan")
    assert result["status"] == "success"
    assert "Rajan" in result["draft_text"]
    assert "PREVENT DEPARTURE" in result["draft_text"]
    assert "BUREAU OF IMMIGRATION" in result["draft_text"]


def test_drafting_api_endpoints():
    """Verify all 4 drafting HTTP API endpoints."""
    # 1. Draft FIR
    res = client.post("/api/v1/draft/fir", json={"narrative": "Accused Rajan committed hawala fraud under Section 420 IPC."})
    assert res.status_code == 200
    assert "draft_text" in res.json()

    # 2. Draft Charge Sheet
    res = client.post("/api/v1/draft/charge-sheet/FIR-TEST-01", json={"accused_name": "Rajan"})
    assert res.status_code == 200
    assert "CS-" in res.json()["charge_sheet_number"]

    # 3. Draft Bank Freeze Notice
    res = client.post("/api/v1/draft/bank-notice/9876543210", json={"bank_name": "Axis Bank"})
    assert res.status_code == 200
    assert "9876543210" in res.json()["draft_text"]

    # 4. Draft LOC
    res = client.post("/api/v1/draft/lookout-circular/Rajan", json={})
    assert res.status_code == 200
    assert "LOC-" in res.json()["loc_ref"]
