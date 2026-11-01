import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.database.postgres import Base


class AuditLedgerEntry(Base):
    """
    Immutable, Cryptographically Chained WORM (Write Once, Read Many) Audit Log.
    Complies with evidentiary integrity standards for Indian Law Enforcement.
    Each entry holds the SHA-256 hash of the previous entry, preventing undetected tampering.
    """
    __tablename__ = "audit_ledger"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    officer_badge = Column(String(64), nullable=False, index=True)
    officer_name = Column(String(128), nullable=False)
    station_id = Column(String(64), nullable=False, index=True)
    action = Column(String(64), nullable=False, index=True)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(128), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), default="127.0.0.1")
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, unique=True, index=True)


class DualWarrantAuthorization(Base):
    """
    Dual-Officer Supervisory Authorization Record for High-Impact Actions
    (e.g., Section 102 CrPC / Section 106 BNSS Bank Freeze, Wiretap, Look Out Circular).
    Requires field IO/Analyst initiation and Supervisory (DSP/SP/DCP) sign-off.
    """
    __tablename__ = "warrant_authorizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = Column(String(64), nullable=False, index=True)
    action_type = Column(String(64), nullable=False)  # FREEZE_BANK_ACCOUNT, SURVEILLANCE_ORDER, ANPR_INTERCEPT
    target_identifier = Column(String(128), nullable=False)  # Account No, Phone No, Plate No
    legal_basis = Column(String(128), nullable=False)  # e.g., "Section 102 CrPC / Section 106 BNSS"
    justification = Column(Text, nullable=False)

    requested_by_badge = Column(String(64), nullable=False)
    requested_by_name = Column(String(128), nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    status = Column(String(32), default="PENDING")  # PENDING, APPROVED, REJECTED
    approved_by_badge = Column(String(64), nullable=True)
    approved_by_name = Column(String(128), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    supervisory_remarks = Column(Text, nullable=True)
    digital_signature_hash = Column(String(64), nullable=True)
