import os
import sys
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database.postgres import SessionLocal
from app.services.forensics.cdr_parser import parse_telecom_cdr_csv
from app.services.forensics.bank_parser import parse_bank_statement_csv
from app.services.forensics.nlp_extractor import ingest_and_parse_fir
from app.services.legal.audit_service import record_audit_event, verify_audit_chain_integrity
from app.services.legal.certificate_65b import generate_65b_certificate
from app.services.external.vahan_service import lookup_vahan_vehicle
from app.services.external.cctns_service import sync_cctns_fir, query_suspect_priors_icjs
from app.services.external.anpr_stream import simulate_anpr_detections


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_telecom_cdr_forensics(db_session):
    """Test 1: Ingest multi-carrier CDR and detect tower distribution & SIM swaps."""
    sample_cdr = """caller,receiver,duration,timestamp,cell_tower,imei,call_type
9876543210,9123456789,180,2026-03-14T10:15:00,TOWER-NOIDA-62,358912093847291,VOICE
9876543210,9811223344,45,2026-03-14T10:25:00,TOWER-DEL-CONN,358912093847291,VOICE
9123456789,9876543210,320,2026-03-14T11:00:00,TOWER-MUM-PORT,358912093847291,VOICE
"""
    cdr_res = parse_telecom_cdr_csv(sample_cdr, db_session)
    assert cdr_res["status"] == "success"
    assert cdr_res["total_records_ingested"] == 3
    assert "TOWER-NOIDA-62" in cdr_res["tower_distribution"]


def test_bank_statement_smurfing_detection(db_session):
    """Test 2: Parse bank statement, detect structuring under ₹50k, and dual-write."""
    sample_bank = """date,narration,amount,type,balance
2026-03-14,UPI/32198301293/Vikram/vikram@okhdfcbank,48500,CR,48500
2026-03-14,UPI/32198301294/Hawala Courier/mule1@paytm,49000,CR,97500
2026-03-14,NEFT-N0918239-Cash Token hawala settlement,49500,DR,48000
"""
    bank_res = parse_bank_statement_csv(sample_bank, "ACC-SUSPECT-01", "Primary Suspect", db_session)
    assert bank_res["status"] == "success"
    assert bank_res["total_transactions_ingested"] == 3
    assert bank_res["structuring_smurfing_detected"] is True


def test_fir_nlp_extraction(db_session):
    """Test 3: Extract IPC/BNS sections, vehicles, and suspects from narrative."""
    sample_fir_text = """
On 14-03-2026, complainant reported an extortion call demanding 50 Lakhs. The accused Vikram Malhotra alias Vicky
operating vehicle DL01AB1234 and accomplice Ramesh Kumar (phone 9876543210) threatened dire consequences.
Case registered u/s 384, 120B IPC and Section 66D IT Act at Sector 62 Police Station.
"""
    fir_res = ingest_and_parse_fir("CASE-FIR-2026-0099", "Extortion & Hawala Syndicate", sample_fir_text, "Inspector Sharma", db_session)
    assert fir_res["status"] == "success"
    assert "DL01AB1234" in fir_res["extracted_entities"]["vehicles_identified"]
    assert len(fir_res["extracted_entities"]["legal_sections"]) > 0


def test_cryptographic_worm_audit_ledger(db_session):
    """Test 4: Verify chained SHA-256 hash log integrity and zero tampering."""
    ev1 = record_audit_event(db_session, "UP-POL-8491", "Inspector Sharma", "PS-NOIDA-62", "ACCESS_CASE", "CASE", "CASE-0099", "Opened case file")
    ev2 = record_audit_event(db_session, "UP-POL-8491", "Inspector Sharma", "PS-NOIDA-62", "EXPORT_CDR", "EVIDENCE", "CDR-9876", "Exported CDR report")
    assert ev2.previous_hash == ev1.current_hash

    audit_check = verify_audit_chain_integrity(db_session)
    assert audit_check["status"] == "VERIFIED_AUTHENTIC"
    assert audit_check["tampered"] is False


def test_section_63_bsa_65b_iea_certificate():
    """Test 5: Generate court-admissible electronic evidence certificate."""
    cert = generate_65b_certificate(
        evidence_id="EVID-CDR-BATCH-01",
        evidence_type="CALL_DETAIL_RECORD",
        evidence_description="Airtel CDR Dump for primary suspect handset",
        officer_name="Inspector Rajesh Sharma",
        officer_rank="Inspector of Police",
        officer_badge="UP-POL-8491",
        station_name="Sector 62 Cyber Police Station"
    )
    assert cert["admissibility_status"] == "COURT_READY"
    assert cert["certificate_id"].startswith("CERT-65B-")
    assert len(cert["digital_signature_hash"]) == 64


def test_government_police_grid_telemetry():
    """Test 6: Query VAHAN national registry, CCTNS FIR sync, ICJS priors, and ANPR feed."""
    vahan = lookup_vahan_vehicle("DL01AB1234")
    assert vahan["status"] == "RECORD_FOUND"
    assert vahan["details"]["owner_name"] == "Vikram Malhotra"

    cctns = sync_cctns_fir("FIR-2026-UP-NOIDA-0142")
    assert cctns["status"] == "SYNCED"
    assert len(cctns["fir_data"]["accused_persons"]) >= 1

    icjs = query_suspect_priors_icjs("Vikram Malhotra")
    assert len(icjs) > 0

    anpr = simulate_anpr_detections(3)
    assert len(anpr) == 3
