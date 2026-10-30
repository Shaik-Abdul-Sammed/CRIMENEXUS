import hashlib
import hmac
import json
import logging
import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.audit_ledger import AuditLedgerEntry, DualWarrantAuthorization
from app.config.settings import JWT_SECRET_KEY

logger = logging.getLogger("crimenexus.legal.audit")

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"
AUDIT_HMAC_SALT = os.getenv("AUDIT_HMAC_SALT", f"{JWT_SECRET_KEY}_audit_worm_ledger_salt_2026").encode("utf-8")


def compute_entry_hash(
    previous_hash: str,
    timestamp_iso: str,
    officer_badge: str,
    station_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: str
) -> str:
    """
    Computes a cryptographic HMAC-SHA-256 digest linking the current record to the previous record.
    Uses a secret server-side key so database compromise cannot allow an attacker to recalculate the chain.
    """
    payload = f"{previous_hash}|{timestamp_iso}|{officer_badge}|{station_id}|{action}|{resource_type}|{resource_id}|{details}"
    return hmac.new(AUDIT_HMAC_SALT, payload.encode("utf-8"), hashlib.sha256).hexdigest()


def record_audit_event(
    db: Session,
    officer_badge: str,
    officer_name: str,
    station_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: str,
    ip_address: str = "127.0.0.1"
) -> AuditLedgerEntry:
    """
    Records an immutable audit event in the WORM ledger with SHA-256 hash chaining.
    """
    # Fetch the latest audit entry to obtain previous_hash
    last_entry = db.query(AuditLedgerEntry).order_by(desc(AuditLedgerEntry.timestamp)).first()
    previous_hash = last_entry.current_hash if last_entry else GENESIS_HASH

    now = datetime.utcnow()
    timestamp_iso = now.isoformat()

    current_hash = compute_entry_hash(
        previous_hash=previous_hash,
        timestamp_iso=timestamp_iso,
        officer_badge=officer_badge,
        station_id=station_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )

    entry = AuditLedgerEntry(
        id=str(uuid.uuid4()),
        timestamp=now,
        officer_badge=officer_badge,
        officer_name=officer_name,
        station_id=station_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        previous_hash=previous_hash,
        current_hash=current_hash
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    logger.info("Immutable audit event logged: %s by %s [%s]", action, officer_badge, current_hash[:12])
    return entry


def verify_audit_chain_integrity(db: Session) -> Dict[str, Any]:
    """
    Audits the entire chain from Genesis to head, checking that:
    1. Every record's previous_hash matches the prior record's current_hash.
    2. Every record's current_hash matches the recomputed SHA-256 of its content.
    Returns proof of authenticity for judicial compliance.
    """
    entries = db.query(AuditLedgerEntry).order_by(AuditLedgerEntry.timestamp.asc()).all()

    if not entries:
        return {
            "status": "VALID",
            "chain_length": 0,
            "message": "Ledger is initialized and empty.",
            "tampered": False
        }

    expected_prev_hash = GENESIS_HASH

    for idx, entry in enumerate(entries):
        # Verify backward pointer
        if entry.previous_hash != expected_prev_hash:
            logger.error("Audit chain broken at index %d (ID: %s). Expected prev %s, got %s",
                         idx, entry.id, expected_prev_hash, entry.previous_hash)
            return {
                "status": "CORRUPTED",
                "chain_length": len(entries),
                "tampered": True,
                "broken_at_index": idx,
                "broken_record_id": entry.id,
                "reason": "Previous hash pointer mismatch."
            }

        # Verify content hash integrity
        recomputed = compute_entry_hash(
            previous_hash=entry.previous_hash,
            timestamp_iso=entry.timestamp.isoformat(),
            officer_badge=entry.officer_badge,
            station_id=entry.station_id,
            action=entry.action,
            resource_type=entry.resource_type,
            resource_id=entry.resource_id,
            details=entry.details or ""
        )

        if recomputed != entry.current_hash:
            logger.error("Data tampering detected at record ID %s! Hash mismatch.", entry.id)
            return {
                "status": "TAMPERED",
                "chain_length": len(entries),
                "tampered": True,
                "broken_at_index": idx,
                "broken_record_id": entry.id,
                "reason": "Payload hash recalculation mismatch. Record content modified after write."
            }

        expected_prev_hash = entry.current_hash

    return {
        "status": "VERIFIED_AUTHENTIC",
        "chain_length": len(entries),
        "tampered": False,
        "latest_hash": entries[-1].current_hash,
        "genesis_verified": True,
        "timestamp_checked": datetime.utcnow().isoformat()
    }
