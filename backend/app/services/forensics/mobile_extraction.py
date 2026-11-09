"""
CRIMENEXUS Mobile Forensic Extraction Legal Gate
Enforces strict statutory compliance under:
- Bharatiya Nagarik Suraksha Sanhita (BNSS 2023) Sections 105 & 185 (Audio-Video Seizure Recording)
- Digital Personal Data Protection Act (DPDP Act 2023) Section 17(b) (Proportionate Law Enforcement Exemption)
- Bharatiya Sakshya Adhiniyam (BSA 2023) Section 63 (Digital Certificate & Hash Verification)

Indian Legal Reality:
BNSS 2023 contains NO provision compelling password disclosure or involuntary biometric device unlocking.
All extractions must possess an authenticated legal basis: Judicial Warrant, Written Consent, or Sec 105 BNSS emergency seizure.
"""

import hashlib
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List

logger = logging.getLogger("crimenexus.forensics.mobile_gate")


class LegalComplianceError(Exception):
    """Raised when a mobile device extraction fails statutory compliance checks."""
    pass


class MobileExtractionGate:
    """
    Mandatory compliance firewall for mobile acquisition.
    Prevents unauthorized or fishing extractions.
    """

    REQUIRED_LEGAL_BASIS = ["WARRANT", "CONSENT", "SECTION_105_BNSS"]

    def __init__(self):
        self.verified_sessions: Dict[str, Any] = {}

    def validate(
        self,
        basis: str,
        officer_badge: str,
        case_number: str,
        device_imei: str,
        magistrate_order: Optional[str] = None,
        consent_signed: bool = False,
        audio_video_recorded: bool = False,
        communications_authorized: bool = False,
        sensitive_data_authorized: bool = False,
    ) -> Dict[str, Any]:
        """
        Validates statutory preconditions before permitting mobile extraction.
        Throws LegalComplianceError if mandatory statutory requirements are violated.
        """
        if not basis or basis.upper() not in self.REQUIRED_LEGAL_BASIS:
            raise LegalComplianceError(
                f"Invalid legal basis '{basis}'. Must be one of: {', '.join(self.REQUIRED_LEGAL_BASIS)}"
            )

        basis_upper = basis.upper()

        if not officer_badge or len(officer_badge.strip()) < 3:
            raise LegalComplianceError("Authorized Investigating Officer badge number is required.")

        if not case_number:
            raise LegalComplianceError("Active Case / FIR number is mandatory for mobile extraction.")

        if not device_imei:
            raise LegalComplianceError("Device IMEI / Serial identifier is required for chain of custody.")

        # 1. Judicial Warrant Verification
        if basis_upper == "WARRANT":
            if not magistrate_order or len(magistrate_order.strip()) < 5:
                raise LegalComplianceError(
                    "Judicial Warrant basis requires a valid Magistrate Search Warrant reference number."
                )

        # 2. Civilian Consent Form Verification
        elif basis_upper == "CONSENT":
            if not consent_signed:
                raise LegalComplianceError(
                    "Consent basis requires verified civilian consent form executed under Section 17(b) DPDP Act 2023."
                )

        # 3. Section 105 BNSS Mandatory Audio-Video Recording Verification
        elif basis_upper == "SECTION_105_BNSS":
            if not audio_video_recorded:
                raise LegalComplianceError(
                    "Section 105/185 BNSS mandates contemporaneous audio-video recording of device seizure for transmission to Magistrate."
                )

        # Compute cryptographic compliance validation token
        token_payload = f"{basis_upper}:{officer_badge}:{case_number}:{device_imei}:{magistrate_order or 'N/A'}:{datetime.utcnow().strftime('%Y-%m-%d')}"
        compliance_hash = hashlib.sha256(token_payload.encode("utf-8")).hexdigest()

        gate_pass = {
            "authorized": True,
            "legal_basis": basis_upper,
            "officer_badge": officer_badge,
            "case_number": case_number,
            "device_imei": device_imei,
            "magistrate_order": magistrate_order,
            "communications_authorized": bool(communications_authorized),
            "sensitive_data_authorized": bool(sensitive_data_authorized),
            "audio_video_recorded": bool(audio_video_recorded),
            "compliance_hash": compliance_hash,
            "validated_at": datetime.utcnow().isoformat(),
            "statutory_mandate": "BNSS 2023 Sec 105/185 & DPDP Act 2023 Sec 17(b)",
        }

        self.verified_sessions[device_imei] = gate_pass
        logger.info("[MobileGate] Extraction authorized for device %s under %s. Hash: %s", device_imei, basis_upper, compliance_hash[:12])
        return gate_pass

    def check_authorization(self, device_imei: str) -> Optional[Dict[str, Any]]:
        return self.verified_sessions.get(device_imei)


_gate_instance = None


def get_mobile_extraction_gate() -> MobileExtractionGate:
    global _gate_instance
    if _gate_instance is None:
        _gate_instance = MobileExtractionGate()
    return _gate_instance
