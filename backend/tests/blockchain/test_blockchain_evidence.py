import pytest
from app.services.legal.blockchain_evidence import BlockchainEvidenceLedger, get_blockchain_ledger
from app.api.blockchain_evidence import blockchain_health, get_blockchain_ledger_blocks, record_custody_transfer, generate_electronic_certificate, CustodyRecordRequest

def test_blockchain_ledger_happy_path_hash_chain():
    """Happy Path: Records consecutive custody transfers and verifies cryptographic hash links."""
    ledger = get_blockchain_ledger()
    initial_len = len(ledger.chain)
    
    b1 = ledger.record_custody_event(
        evidence_id="EVID-TEST-99",
        case_id="FIR-2026-TEST",
        custodian_name="IO Test Officer",
        action="SEIZURE_MOMENT"
    )
    assert b1["index"] == initial_len
    assert len(b1["block_hash"]) == 64
    
    b2 = ledger.record_custody_event(
        evidence_id="EVID-TEST-99",
        case_id="FIR-2026-TEST",
        custodian_name="Malkhana Incharge",
        action="SAFE_DEPOSIT"
    )
    assert b2["previous_hash"] == b1["block_hash"]
    
    # Check integrity
    check = ledger.verify_chain_integrity()
    assert check["is_valid"] is True

def test_blockchain_tamper_detection_edge_case():
    """Edge Case: Tampering with a historical block's action must fail the integrity check."""
    temp_ledger = BlockchainEvidenceLedger()
    temp_ledger.record_custody_event("EX-1", "CASE-1", "Officer A", "INITIAL")
    temp_ledger.record_custody_event("EX-1", "CASE-1", "Officer B", "TRANSFER")
    
    assert temp_ledger.verify_chain_integrity()["is_valid"] is True
    
    # Intentionally corrupt block 1
    temp_ledger.chain[1]["action"] = "TAMPERED_ACTION"
    corrupt_check = temp_ledger.verify_chain_integrity()
    assert corrupt_check["is_valid"] is False
    assert corrupt_check["compromised_block_index"] == 1

def test_blockchain_api_certificate_generation():
    """API Validation: Checks health, ledger blocks, and generates BSA Sec 63 certificate."""
    health = blockchain_health()
    assert health["status"] == "healthy"
    assert health["chain_intact"] is True
    
    cert = generate_electronic_certificate("EVID-CCTV-2026-09")
    assert "SECTION 63 BHARATIYA SAKSHYA ADHINIYAM" in cert["certificate_title"]
    assert len(cert["custody_trail"]) >= 1
