"""
Test Suite: Mobile Extraction Legal Gate & Class D Auto-Deletion
Tests:
1. Gating fails if legal basis is missing or invalid
2. Gating fails if WARRANT basis lacks a magistrate order reference
3. Gating fails if CONSENT basis is not signed
4. Gating fails if SECTION_105_BNSS lacks mandatory audio-video recording
5. Successful validation returns compliance hash and authorization token
6. Class D personal data (photos, banking passwords) is automatically purged under DPDP Act 2023
"""

import os
import sys
import pytest

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.services.forensics.mobile_extraction import (
    MobileExtractionGate,
    LegalComplianceError,
    get_mobile_extraction_gate,
)
from app.services.forensics.mobile_data_classifier import (
    MobileDataClassifier,
    get_mobile_data_classifier,
)


def test_gate_rejects_missing_or_invalid_legal_basis():
    """Test 1: Extraction without valid legal basis must raise LegalComplianceError."""
    gate = MobileExtractionGate()
    with pytest.raises(LegalComplianceError) as exc_info:
        gate.validate(
            basis="UNAUTHORIZED_FISHING",
            officer_badge="DL-POL-IO-8812",
            case_number="FIR-2026-8812",
            device_imei="860123456789012",
        )
    assert "Invalid legal basis" in str(exc_info.value)


def test_gate_rejects_warrant_without_magistrate_order():
    """Test 2: WARRANT basis without a magistrate order number must be rejected."""
    gate = MobileExtractionGate()
    with pytest.raises(LegalComplianceError) as exc_info:
        gate.validate(
            basis="WARRANT",
            officer_badge="DL-POL-IO-8812",
            case_number="FIR-2026-8812",
            device_imei="860123456789012",
            magistrate_order=None,  # Missing
        )
    assert "Magistrate Search Warrant reference number" in str(exc_info.value)


def test_gate_rejects_consent_without_signature():
    """Test 3: CONSENT basis without verified signature must be rejected."""
    gate = MobileExtractionGate()
    with pytest.raises(LegalComplianceError) as exc_info:
        gate.validate(
            basis="CONSENT",
            officer_badge="DL-POL-IO-8812",
            case_number="FIR-2026-8812",
            device_imei="860123456789012",
            consent_signed=False,  # Unsigned
        )
    assert "civilian consent form" in str(exc_info.value)


def test_gate_rejects_sec105_without_audio_video_recording():
    """Test 4: Section 105 BNSS seizure without mandatory video recording must be rejected."""
    gate = MobileExtractionGate()
    with pytest.raises(LegalComplianceError) as exc_info:
        gate.validate(
            basis="SECTION_105_BNSS",
            officer_badge="DL-POL-IO-8812",
            case_number="FIR-2026-8812",
            device_imei="860123456789012",
            audio_video_recorded=False,  # Violation of BNSS 105
        )
    assert "Section 105/185 BNSS mandates contemporaneous audio-video recording" in str(exc_info.value)


def test_gate_authorizes_valid_warrant():
    """Test 5: Valid warrant with magistrate order returns authorized gate pass."""
    gate = MobileExtractionGate()
    gate_pass = gate.validate(
        basis="WARRANT",
        officer_badge="DL-POL-IO-8812",
        case_number="FIR-2026-8812",
        device_imei="860123456789012",
        magistrate_order="WAR-CMM-DEL-2026-904",
        communications_authorized=True,
    )

    assert gate_pass["authorized"] is True
    assert gate_pass["legal_basis"] == "WARRANT"
    assert "compliance_hash" in gate_pass
    assert len(gate_pass["compliance_hash"]) == 64


def test_classifier_purges_class_d_data():
    """Test 6: Classifier automatically detects and deletes Class D irrelevant personal data."""
    classifier = get_mobile_data_classifier()

    raw_artifacts = [
        {"id": "art-1", "type": "imei_number", "val": "860123456789012"},  # Class A
        {"id": "art-2", "type": "family_photo_album", "val": "vacation.jpg"},  # Class D
        {"id": "art-3", "type": "banking_password_note", "val": "pin1234"},  # Class D
        {"id": "art-4", "type": "device_model", "val": "OnePlus 11"},  # Class A
    ]

    result = classifier.process_and_sanitize(raw_artifacts)

    assert result["purged_class_d_count"] == 2
    assert result["retained_count"] == 2
    retained_ids = [item["id"] for item in result["retained_artifacts"]]
    assert "art-1" in retained_ids
    assert "art-4" in retained_ids
    assert "art-2" not in retained_ids
    assert "art-3" not in retained_ids
