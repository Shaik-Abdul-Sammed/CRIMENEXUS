"""
Test Suite: DPDP Act 2023 Compliance & Section 63 BSA Electronic Certification
Tests:
1. Verify Class C sensitive data (health records, biometrics) is blocked without explicit judicial authorization
2. Verify Class B communications (SMS, WhatsApp) is blocked if warrant lacks communications scope
3. Verify Class C and Class B are retained when explicitly authorized by judicial order
4. Verify Section 63 BSA certificate is generated with root SHA-256 bitstream manifest
5. Verify consent form generation contains DPDP Act 2023 Section 17(b) statutory covenants
"""

import os
import sys
import pytest

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.services.forensics.mobile_data_classifier import get_mobile_data_classifier
from app.services.forensics.mobile_hash_manifest import get_mobile_hash_manifest
from app.services.forensics.consent_form_generator import generate_consent_form_text


def test_dpdp_blocks_class_c_without_judicial_authorization():
    """Test 1: Sensitive Class C records are blocked if sensitive_data_authorized is False."""
    classifier = get_mobile_data_classifier()

    artifacts = [
        {"id": "id-1", "type": "device_imei", "metadata": {"imei": "860000000000001"}},
        {"id": "sens-1", "type": "health_medical_record", "metadata": {"diagnosis": "Confidential"}},
        {"id": "sens-2", "type": "biometric_fingerprint_raw", "metadata": {"template": "0x1234"}},
    ]

    result = classifier.process_and_sanitize(
        raw_artifacts=artifacts,
        sensitive_data_authorized=False,  # Unauthorized
    )

    assert result["blocked_unauthorized_count"] == 2
    retained_ids = [a["id"] for a in result["retained_artifacts"]]
    assert "id-1" in retained_ids
    assert "sens-1" not in retained_ids
    assert "sens-2" not in retained_ids


def test_dpdp_blocks_class_b_without_communications_warrant_mandate():
    """Test 2: Communications (SMS/WhatsApp) are blocked if communications_authorized is False."""
    classifier = get_mobile_data_classifier()

    artifacts = [
        {"id": "id-1", "type": "subscriber_phone", "metadata": {"phone": "+91 99999 88888"}},
        {"id": "comm-1", "type": "whatsapp_chat_db", "metadata": {"chat_count": 45}},
        {"id": "comm-2", "type": "sms_inbox", "metadata": {"msg_count": 120}},
    ]

    result = classifier.process_and_sanitize(
        raw_artifacts=artifacts,
        communications_authorized=False,  # Warrant lacks communications mandate
    )

    assert result["blocked_unauthorized_count"] == 2
    retained_ids = [a["id"] for a in result["retained_artifacts"]]
    assert "id-1" in retained_ids
    assert "comm-1" not in retained_ids
    assert "comm-2" not in retained_ids


def test_dpdp_retains_authorized_records():
    """Test 3: Retains Class B and Class C when explicitly authorized by Sessions Court order."""
    classifier = get_mobile_data_classifier()

    artifacts = [
        {"id": "comm-1", "type": "whatsapp_chat_db", "metadata": {"chat_count": 45}},
        {"id": "sens-1", "type": "health_medical_record", "metadata": {"diagnosis": "Hospital Admission"}},
    ]

    result = classifier.process_and_sanitize(
        raw_artifacts=artifacts,
        communications_authorized=True,
        sensitive_data_authorized=True,
    )

    assert result["retained_count"] == 2
    assert result["blocked_unauthorized_count"] == 0


def test_section_63_bsa_certificate_issuance():
    """Test 4: Generates signed Section 63 BSA certificate with SHA-256 root manifest."""
    manifest_mgr = get_mobile_hash_manifest()

    artifacts = [
        {"id": "art-01", "type": "imei_number", "content": "860123456789012"},
        {"id": "art-02", "type": "call_log_entry", "content": "Call to +91 98765 43210 at 14:15 IST"},
    ]

    seal_result = manifest_mgr.seal_artifacts(
        case_number="FIR-2026-8812",
        device_imei="860123456789012",
        officer_badge="DL-POL-IO-8812",
        officer_name="Inspector Rajesh Varma",
        artifacts=artifacts,
        db=None,
    )

    assert seal_result["status"] == "CERTIFIED_SEALED"
    assert "root_manifest_hash" in seal_result
    assert len(seal_result["root_manifest_hash"]) == 64
    assert seal_result["records_certified"] == 2
    assert "BHARATIYA SAKSHYA ADHINIYAM, 2023" in seal_result["section_63_bsa_certificate"]
    assert "860123456789012" in seal_result["section_63_bsa_certificate"]


def test_consent_form_generator_cites_dpdp_and_bnss():
    """Test 5: Generated consent form explicitly cites Section 17(b) DPDP and Section 105 BNSS."""
    form = generate_consent_form_text(
        citizen_name="Amitabh Saxena",
        device_imei="860999111222333",
        device_model="Samsung Galaxy S23",
        case_number="FIR-2026-9043",
        officer_name="Inspector V. K. Sharma",
        officer_badge="DL-POL-IO-9043",
        police_station="Cyber Crime PS Central Delhi",
    )

    assert form["status"] == "CONSENT_FORM_GENERATED"
    assert "Section 17(b) Digital Personal Data Protection Act" in form["form_text"]
    assert "Section 105 BNSS" in form["form_text"]
    assert "Amitabh Saxena" in form["form_text"]
    assert "860999111222333" in form["form_text"]
    assert "sha256_seal" in form
