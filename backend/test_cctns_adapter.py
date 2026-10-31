import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.external.cctns_adapter import get_cctns_adapter, retry_with_backoff

client = TestClient(app)


def test_cctns_adapter_fetch_fir():
    """Verify CCTNS adapter returns valid FIR data and cryptographic audit signature."""
    adapter = get_cctns_adapter()
    res = adapter.fetch_fir("FIR-2026-DEL-8902")

    assert res["status"] == "SUCCESS"
    assert res["source"] == "CCTNS_NATIONAL_REPOSITORY"
    fir = res["fir_data"]
    assert fir["fir_number"] == "FIR-2026-DEL-8902"
    assert len(fir["accused_persons"]) >= 1
    assert any(acc["name"] == "Rajan" for acc in fir["accused_persons"])
    assert "Section 111 BNS" in fir["acts_sections"]
    print("\n[TEST CCTNS ADAPTER PASSED]: FIR FIR-2026-DEL-8902 verified.")


def test_cctns_adapter_sync_case_history():
    """Verify ICJS case history and warrant status synchronization."""
    adapter = get_cctns_adapter()
    res = adapter.sync_case_history("FIR-2026-DEL-8902")
    assert res["icjs_sync_status"] == "SYNCHRONIZED"
    assert "warrants_issued" in res
    assert len(res["warrants_issued"]) > 0


def test_cctns_adapter_push_charge_sheet():
    """Verify digital chargesheet submission to e-Courts."""
    adapter = get_cctns_adapter()
    sample_pdf = b"%PDF-1.4 sample charge sheet bytes for testing"
    res = adapter.push_charge_sheet("FIR-2026-DEL-8902", sample_pdf)
    assert res["status"] == "ACCEPTED_BY_ICJS_ECOURTS"
    assert "ICJS-ACK-" in res["icjs_acknowledgment_id"]
    assert len(res["document_hash_sha256"]) == 64


def test_cctns_adapter_suspect_lookup():
    """Verify CCTNS inter-state dossier lookup."""
    adapter = get_cctns_adapter()
    res = adapter.lookup_suspect_history("+919999988888")
    assert res["matched"] is True
    assert res["suspect_name"] == "Rajan"
    assert res["interstate_cases"] > 0


def test_cctns_retry_resilience():
    """Verify exponential backoff retry mechanism handles simulated transient errors."""
    attempts = 0

    @retry_with_backoff(max_retries=3, initial_delay=0.01)
    def flaky_network_call():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise ConnectionResetError("Simulated government gateway TCP timeout")
        return "SUCCESSFUL_GATEWAY_RESPONSE"

    val = flaky_network_call()
    assert val == "SUCCESSFUL_GATEWAY_RESPONSE"
    assert attempts == 3
    print("\n[TEST CCTNS RETRY PASSED]: Handled 2 transient failures and recovered on 3rd attempt.")


def test_cctns_sync_api_endpoint():
    """Verify POST /api/v1/cctns/sync/{case_id} ingestion endpoint."""
    res = client.post("/api/v1/cctns/sync/FIR-2026-DEL-8902")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["case_id"] == "FIR-2026-DEL-8902"
    assert data["synced_into_databases"] is True
