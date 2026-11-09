"""
CRIMENEXUS Mobile Forensic Consent Form Generator
Generates court-admissible consent documents citing:
- Section 105 Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)
- Section 17(b) Digital Personal Data Protection Act (DPDP Act 2023)
- Section 63 Bharatiya Sakshya Adhiniyam (BSA 2023)

Enforces transparent disclosure: The civilian / suspect is informed of the EXACT data classes
being extracted, with explicit statutory guarantee that Class D private personal records
will NOT be copied or ingested.
"""

import hashlib
from datetime import datetime
from typing import Dict, Any, Optional


def generate_consent_form_text(
    citizen_name: str,
    device_imei: str,
    device_model: str,
    case_number: str,
    officer_name: str,
    officer_badge: str,
    police_station: str,
    scope_communications: bool = False,
    scope_identifiers_only: bool = True,
) -> Dict[str, Any]:
    """Generates statutory mobile forensic consent agreement text and compliance payload."""

    extracted_classes = ["Class A: Hardware & SIM Identifiers (IMEI, Phone, Network Logs)"]
    if scope_communications:
        extracted_classes.append("Class B: Interpersonal Communications Relevant to FIR (SMS/Call Logs)")

    excluded_classes = [
        "Class C: Sensitive Personal Biometrics & Health Records",
        "Class D: Personal Family Albums, Banking PINs, and Private Browsing Records"
    ]

    timestamp_str = datetime.utcnow().strftime("%d %B %Y, %H:%M:%S UTC")

    text = f"""STATUTORY CONSENT FORM FOR VOLUNTARY MOBILE FORENSIC EXAMINATION
UNDER SECTION 105 BNSS 2023 & SECTION 17(b) DIGITAL PERSONAL DATA PROTECTION ACT 2023

GOVERNMENT OF NCT OF DELHI / STATE POLICE DEPARTMENT
INVESTIGATION BRANCH: {police_station}
CASE REFERENCE: {case_number}
DATE & TIME OF CONSENT: {timestamp_str}

1. PARTIES:
   - Device Owner / Possessor: {citizen_name}
   - Authorized Investigating Officer: {officer_name} (Badge: {officer_badge})
   - Seized / Examined Device: {device_model} (IMEI/Serial: {device_imei})

2. STATUTORY DISCLOSURES & INFORMED CONSENT:
   I, {citizen_name}, hereby confirm that I have been clearly informed that:
   (a) Under the Bharatiya Nagarik Suraksha Sanhita (BNSS 2023), there is NO statutory compulsion
       forcing me to disclose passcodes, encryption keys, or submit to involuntary biometric unlocking.
   (b) Under Section 17(b) of the Digital Personal Data Protection Act (DPDP Act 2023), personal data
       may be extracted for lawful investigation only to the extent strictly NECESSARY and PROPORTIONATE.
   (c) I voluntarily grant permission for logical forensic data extraction using open-source, auditable
       extraction tools (AndroidQF / ALEAPP / ADB) strictly confined to the agreed scope below.

3. AGREED EXTRACTION SCOPE:
   {chr(10).join('   [AUTHORIZED] ' + c for c in extracted_classes)}

4. GUARANTEED STATUTORY EXCLUSIONS (CLASS D PURGE):
   The investigating agency explicitly covenants that the following data categories SHALL NOT BE COPIED,
   SHALL BE AUTOMATICALLY PURGED AT INGESTION, AND WILL NOT ENTER POLICE DOSSIERS:
   {chr(10).join('   [EXCLUDED & PURGED] ' + e for e in excluded_classes)}

5. CHAIN OF CUSTODY & EVIDENCE CERTIFICATION:
   All acquired records shall be hashed with SHA-256 in my presence and sealed pursuant to Section 63
   of the Bharatiya Sakshya Adhiniyam, 2023. Contemporaneous audio-video recording of this procedure
   has been initiated pursuant to Section 105 of the BNSS.

SIGNATURE / DIGITAL THUMBPRINT OF CITIZEN: [VOLUNTARY CONSENT RECORDED]
SIGNATURE OF INVESTIGATING OFFICER: {officer_name} ({officer_badge})
"""

    sha256_seal = hashlib.sha256(text.encode("utf-8")).hexdigest()

    return {
        "status": "CONSENT_FORM_GENERATED",
        "case_number": case_number,
        "device_imei": device_imei,
        "citizen_name": citizen_name,
        "officer_badge": officer_badge,
        "sha256_seal": sha256_seal,
        "timestamp": timestamp_str,
        "form_text": text,
        "legal_statutes": [
            "Section 105 BNSS 2023",
            "Section 185 BNSS 2023",
            "Section 17(b) DPDP Act 2023",
            "Section 63 BSA 2023"
        ],
    }
