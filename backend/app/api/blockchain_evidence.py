import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.services.legal.blockchain_evidence import get_blockchain_ledger

logger = logging.getLogger("crimenexus.blockchain_evidence")

router = APIRouter(tags=["Blockchain Evidence Chain-of-Custody"])

class CustodyRecordRequest(BaseModel):
    evidence_id: str
    case_id: str
    custodian_name: str
    action: str = Field(..., description="SEIZURE, MALKHANA_STORAGE, FSL_TRANSFER, COURT_PRODUCTION")
    metadata: Optional[Dict[str, Any]] = None

@router.get("/blockchain-evidence/health", summary="Blockchain Evidence Health Check")
@router.get("/blockchain/health", summary="Blockchain Health Check")
def blockchain_health():
    ledger = get_blockchain_ledger()
    integrity = ledger.verify_chain_integrity()
    return {
        "status": "healthy",
        "service": "Blockchain Evidence Chain-of-Custody (WORM Merkle Tree)",
        "chain_intact": integrity["is_valid"],
        "total_blocks": integrity["total_blocks"],
        "statutory_law": "Bharatiya Sakshya Adhiniyam 2023 Sec 63",
        "version": "1.0.0"
    }

@router.get("/blockchain/ledger", summary="Get Full Blockchain Chain-of-Custody Blocks")
def get_blockchain_ledger_blocks():
    ledger = get_blockchain_ledger()
    return {
        "blocks": ledger.chain,
        "integrity": ledger.verify_chain_integrity()
    }

@router.post("/blockchain/record", summary="Record Cryptographic Custody Transfer Event")
def record_custody_transfer(payload: CustodyRecordRequest):
    ledger = get_blockchain_ledger()
    new_block = ledger.record_custody_event(
        evidence_id=payload.evidence_id,
        case_id=payload.case_id,
        custodian_name=payload.custodian_name,
        action=payload.action,
        metadata=payload.metadata
    )
    return new_block

@router.get("/blockchain/certificate-65b/{evidence_id}", summary="Generate BSA Sec 63 / Sec 65B Electronic Evidence Certificate")
def generate_electronic_certificate(evidence_id: str):
    ledger = get_blockchain_ledger()
    cert = ledger.generate_sec_65b_certificate(evidence_id=evidence_id)
    return cert
