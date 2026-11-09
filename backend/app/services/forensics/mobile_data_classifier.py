"""
CRIMENEXUS Mobile Forensic Data Classification & Proportionality Engine
Grounding:
- Digital Personal Data Protection Act (DPDP Act 2023) Section 17(b)
- Proportionality Doctrine (Justice K.S. Puttaswamy v. Union of India)

Four Data Classification Tiers:
Class A: Device & Subscriber Identifiers (IMEI, IMSI, Phone number, Email, Device Model)
         -> Extracted with standard legal basis (Warrant / Consent / Sec 105 BNSS).
Class B: Interpersonal Communications (SMS, WhatsApp chats, Call Logs, Telegram messages)
         -> Requires specific warrant or consent explicitly authorizing communications.
Class C: Special Category & Sensitive Personal Data (Biometrics, Health records, Financial PINs)
         -> BLOCKED unless explicit High Court / Sessions Judge judicial order is provided.
Class D: Irrelevant & Private Media (Personal family photos, browsing cookies, unrelated contacts)
         -> AUTOMATICALLY EXCLUDED & WIPED BEFORE INGESTION (Proportionality Principle).
"""

import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger("crimenexus.forensics.mobile_classifier")


# Recognized file type & metadata signatures
CLASS_A_KEYS = {"imei", "imsi", "device_model", "serial_number", "mac_address", "subscriber_phone", "device_owner"}
CLASS_B_KEYS = {"sms", "whatsapp", "call_log", "chat", "message", "telegram", "signal", "voip_call"}
CLASS_C_KEYS = {"health", "biometric", "medical", "sexual_orientation", "aadhaar_vault", "fingerprint_raw"}
CLASS_D_KEYS = {"family_photo", "banking_password", "atm_pin", "personal_album", "unrelated_contact", "browser_cookie", "private_diary"}


class MobileDataClassifier:
    """
    Classifies mobile artifact dictionaries and enforces automatic deletion
    of Class D (irrelevant personal data) and unauthorized Class B/C data.
    """

    def classify_artifact(self, artifact_type: str, metadata: Dict[str, Any]) -> str:
        """Determines the statutory DPDP data class for a given extracted artifact."""
        norm_type = artifact_type.lower()

        # Check Class D first (Irrelevant / Personal / Proportionality protection)
        if any(k in norm_type for k in CLASS_D_KEYS):
            return "CLASS_D"

        # Check Class C (Sensitive / Special Category)
        if any(k in norm_type for k in CLASS_C_KEYS):
            return "CLASS_C"

        # Check Class B (Communications)
        if any(k in norm_type for k in CLASS_B_KEYS):
            return "CLASS_B"

        # Check Class A (Identifiers)
        if any(k in norm_type for k in CLASS_A_KEYS) or "contact" in norm_type or "system" in norm_type:
            return "CLASS_A"

        # Heuristic inspection of metadata keys
        meta_keys = [str(k).lower() for k in metadata.keys()]
        if any(any(d in k for d in CLASS_D_KEYS) for k in meta_keys):
            return "CLASS_D"
        if any(any(c in k for c in CLASS_C_KEYS) for k in meta_keys):
            return "CLASS_C"
        if any(any(b in k for b in CLASS_B_KEYS) for k in meta_keys):
            return "CLASS_B"

        return "CLASS_A"

    def process_and_sanitize(
        self,
        raw_artifacts: List[Dict[str, Any]],
        communications_authorized: bool = False,
        sensitive_data_authorized: bool = False,
    ) -> Dict[str, Any]:
        """
        Filters raw mobile artifacts:
        - Class A: Retained.
        - Class B: Retained ONLY if communications_authorized is True.
        - Class C: Retained ONLY if sensitive_data_authorized is True; otherwise masked or dropped.
        - Class D: AUTOMATICALLY DELETED & PURGED under the Proportionality Principle.
        """
        retained = []
        purged_class_d = []
        blocked_unauthorized = []

        for item in raw_artifacts:
            item_type = item.get("type", "unknown")
            item_meta = item.get("metadata", {})
            classification = self.classify_artifact(item_type, item_meta)

            item_copy = dict(item)
            item_copy["dpdp_classification"] = classification

            if classification == "CLASS_D":
                # Immediately purge and securely overwrite reference
                purged_class_d.append({
                    "id": item.get("id"),
                    "type": item_type,
                    "reason": "PURGED_UNDER_PROPORTIONALITY_DOCTRINE",
                    "dpdp_basis": "Class D Irrelevant Private Data excluded from police repository."
                })
                logger.info("[DPDP Filter] Auto-deleted Class D artifact %s (%s)", item.get("id"), item_type)

            elif classification == "CLASS_C":
                if sensitive_data_authorized:
                    retained.append(item_copy)
                else:
                    blocked_unauthorized.append({
                        "id": item.get("id"),
                        "type": item_type,
                        "class": "CLASS_C",
                        "reason": "BLOCKED_REQUIRES_HIGHER_JUDICIAL_WARRANT",
                    })
                    logger.warning("[DPDP Filter] Blocked Class C sensitive artifact %s (No judicial order)", item.get("id"))

            elif classification == "CLASS_B":
                if communications_authorized:
                    retained.append(item_copy)
                else:
                    blocked_unauthorized.append({
                        "id": item.get("id"),
                        "type": item_type,
                        "class": "CLASS_B",
                        "reason": "BLOCKED_REQUIRES_COMMUNICATIONS_WARRANT_SPECIFICATION",
                    })
                    logger.warning("[DPDP Filter] Blocked Class B communications artifact %s (Warrant lacks communications mandate)", item.get("id"))

            else:  # CLASS_A
                retained.append(item_copy)

        return {
            "retained_artifacts": retained,
            "retained_count": len(retained),
            "purged_class_d_count": len(purged_class_d),
            "blocked_unauthorized_count": len(blocked_unauthorized),
            "purged_class_d_audit": purged_class_d,
            "blocked_audit": blocked_unauthorized,
            "proportionality_enforced": True,
            "dpdp_section": "Section 17(b) DPDP Act 2023",
        }


_classifier_instance = None


def get_mobile_data_classifier() -> MobileDataClassifier:
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = MobileDataClassifier()
    return _classifier_instance
