import hashlib
import logging
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.postgres import get_db
from app.models.audit_ledger import AuditLedgerEntry, DualWarrantAuthorization
from app.services.legal.audit_service import record_audit_event, verify_audit_chain_integrity
from app.services.legal.certificate_65b import generate_65b_certificate

logger = logging.getLogger("crimenexus.api.legal")

router = APIRouter(prefix="/legal", tags=["Legal Compliance & Evidentiary Chain"])


# --- Request & Response Schemas ---
class AuditLogRequest(BaseModel):
    officer_badge: str
    officer_name: str
    station_id: str
    action: str
    resource_type: str
    resource_id: str
    details: str
    ip_address: Optional[str] = "127.0.0.1"


class Certificate65BRequest(BaseModel):
    evidence_id: str
    evidence_type: str = "TELECOM_CDR"
    evidence_description: str = "CDR dump covering suspect communication timeline"
    officer_name: str = "Inspector R. K. Sharma"
    officer_rank: str = "Inspector of Police"
    officer_badge: str = "UP-POL-8491"
    station_name: str = "PS Sector 62 Noida Cyber Cell"
    sha256_hash: Optional[str] = None
    md5_hash: Optional[str] = None


class WarrantInitiateRequest(BaseModel):
    case_number: str
    action_type: str  # FREEZE_BANK_ACCOUNT, SURVEILLANCE_ORDER, LOOK_OUT_CIRCULAR
    target_identifier: str  # Account No / Phone No / Plate No
    legal_basis: str = "Section 102 CrPC / Section 106 BNSS"
    justification: str
    requested_by_badge: str
    requested_by_name: str


class WarrantApprovalRequest(BaseModel):
    warrant_id: str
    decision: str  # APPROVED or REJECTED
    approved_by_badge: str
    approved_by_name: str
    supervisory_remarks: str


# --- Endpoints ---

@router.post("/audit/log", summary="Record evidentiary action in WORM cryptographic ledger")
def log_audit_action(payload: AuditLogRequest, db: Session = Depends(get_db)):
    """
    Records an immutable audit event chained with SHA-256 to prior records.
    """
    try:
        entry = record_audit_event(
            db=db,
            officer_badge=payload.officer_badge,
            officer_name=payload.officer_name,
            station_id=payload.station_id,
            action=payload.action,
            resource_type=payload.resource_type,
            resource_id=payload.resource_id,
            details=payload.details,
            ip_address=payload.ip_address or "127.0.0.1"
        )
        return {
            "status": "RECORDED",
            "audit_id": entry.id,
            "current_hash": entry.current_hash,
            "previous_hash": entry.previous_hash,
            "timestamp": entry.timestamp.isoformat()
        }
    except Exception as exc:
        logger.error("Failed to record audit event: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/audit/verify-chain", summary="Verify complete WORM ledger integrity from Genesis to Head")
def verify_audit_ledger(db: Session = Depends(get_db)):
    """
    Traverses the cryptographic ledger, recalculating hashes to prove zero tampering in a Court of Law.
    """
    result = verify_audit_chain_integrity(db)
    return result


@router.get("/audit/recent", summary="Fetch recent immutable audit trail records")
def get_recent_audit_records(limit: int = 50, db: Session = Depends(get_db)):
    records = db.query(AuditLedgerEntry).order_by(desc(AuditLedgerEntry.timestamp)).limit(limit).all()
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "officer_badge": r.officer_badge,
            "officer_name": r.officer_name,
            "station_id": r.station_id,
            "action": r.action,
            "resource_type": r.resource_type,
            "resource_id": r.resource_id,
            "details": r.details,
            "previous_hash": r.previous_hash,
            "current_hash": r.current_hash
        }
        for r in records
    ]


@router.post("/certificate-65b/generate", summary="Generate Section 63 BSA / Section 65B IEA Electronic Evidence Certificate")
def create_certificate_65b(payload: Certificate65BRequest, db: Session = Depends(get_db)):
    """
    Produces a legally sound digital certificate with SHA-256 & MD5 checksums,
    lawful custody affirmation, and platform verification for court submission.
    """
    cert = generate_65b_certificate(
        evidence_id=payload.evidence_id,
        evidence_type=payload.evidence_type,
        evidence_description=payload.evidence_description,
        officer_name=payload.officer_name,
        officer_rank=payload.officer_rank,
        officer_badge=payload.officer_badge,
        station_name=payload.station_name,
        provided_sha256=payload.sha256_hash,
        provided_md5=payload.md5_hash
    )

    # Automatically record certificate generation in the audit ledger
    try:
        record_audit_event(
            db=db,
            officer_badge=payload.officer_badge,
            officer_name=payload.officer_name,
            station_id=payload.station_name,
            action="GENERATE_65B_CERTIFICATE",
            resource_type="EVIDENCE",
            resource_id=payload.evidence_id,
            details=f"Generated Section 63 BSA / 65B IEA Certificate: {cert['certificate_id']}"
        )
    except Exception as exc:
        logger.warning("Could not auto-log certificate creation to audit ledger: %s", exc)

    return cert


@router.post("/warrant-approval/request", summary="Submit Dual-Officer Authorization request for high-impact police actions")
def submit_warrant_request(payload: WarrantInitiateRequest, db: Session = Depends(get_db)):
    """
    Initiates a request for bank freeze, wiretap, or interception requiring supervisory sign-off.
    """
    warrant = DualWarrantAuthorization(
        case_number=payload.case_number,
        action_type=payload.action_type,
        target_identifier=payload.target_identifier,
        legal_basis=payload.legal_basis,
        justification=payload.justification,
        requested_by_badge=payload.requested_by_badge,
        requested_by_name=payload.requested_by_name,
        status="PENDING"
    )
    db.add(warrant)
    db.commit()
    db.refresh(warrant)

    # Log to audit trail
    record_audit_event(
        db=db,
        officer_badge=payload.requested_by_badge,
        officer_name=payload.requested_by_name,
        station_id="STATION_FIELD",
        action="REQUEST_WARRANT_APPROVAL",
        resource_type="WARRANT_REQUEST",
        resource_id=warrant.id,
        details=f"Requested {payload.action_type} on target {payload.target_identifier}"
    )

    return {
        "status": "SUBMITTED_FOR_SUPERVISORY_APPROVAL",
        "warrant_id": warrant.id,
        "action_type": warrant.action_type,
        "target": warrant.target_identifier,
        "current_status": "PENDING"
    }


@router.post("/warrant-approval/approve", summary="Supervisory Officer (DSP/SP/DCP) sign-off on high-impact police actions")
def approve_warrant_request(payload: WarrantApprovalRequest, db: Session = Depends(get_db)):
    warrant = db.query(DualWarrantAuthorization).filter(DualWarrantAuthorization.id == payload.warrant_id).first()
    if not warrant:
        raise HTTPException(status_code=404, detail="Warrant request not found.")

    if warrant.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request is already resolved ({warrant.status}).")

    decision = payload.decision.upper()
    if decision not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Decision must be APPROVED or REJECTED.")

    now = datetime.utcnow()
    warrant.status = decision
    warrant.approved_by_badge = payload.approved_by_badge
    warrant.approved_by_name = payload.approved_by_name
    warrant.approved_at = now
    warrant.supervisory_remarks = payload.supervisory_remarks

    # Calculate digital signature hash for supervisory approval
    sig_raw = f"{warrant.id}|{decision}|{payload.approved_by_badge}|{now.isoformat()}"
    warrant.digital_signature_hash = hashlib.sha256(sig_raw.encode()).hexdigest()

    db.commit()
    db.refresh(warrant)

    # Record in audit ledger
    record_audit_event(
        db=db,
        officer_badge=payload.approved_by_badge,
        officer_name=payload.approved_by_name,
        station_id="SUPERVISORY_HQ",
        action=f"SUPERVISORY_{decision}",
        resource_type="WARRANT_DECISION",
        resource_id=warrant.id,
        details=f"Warrant {warrant.id} {decision} by {payload.approved_by_name}. Remarks: {payload.supervisory_remarks}"
    )

    return {
        "status": "SUCCESS",
        "warrant_id": warrant.id,
        "decision": warrant.status,
        "approved_by": warrant.approved_by_name,
        "digital_signature_hash": warrant.digital_signature_hash
    }


@router.get("/warrant-approval/pending", summary="List pending high-impact police actions requiring supervisory approval")
def get_pending_warrants(db: Session = Depends(get_db)):
    pending = db.query(DualWarrantAuthorization).filter(DualWarrantAuthorization.status == "PENDING").all()
    return [
        {
            "id": w.id,
            "case_number": w.case_number,
            "action_type": w.action_type,
            "target_identifier": w.target_identifier,
            "legal_basis": w.legal_basis,
            "justification": w.justification,
            "requested_by_badge": w.requested_by_badge,
            "requested_by_name": w.requested_by_name,
            "requested_at": w.requested_at.isoformat()
        }
        for w in pending
    ]
