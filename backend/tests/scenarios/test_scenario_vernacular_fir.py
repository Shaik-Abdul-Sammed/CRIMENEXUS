"""
Scenario: Regional Vernacular Language FIR Ingestion & Sovereign Translation.
Tests:
  1. Submit a Hindi FIR text -> verify translated to English and suspects/sections extracted.
  2. Submit a Marathi FIR -> verify extraction works.
  3. Submit a Kannada FIR -> verify extraction works.
  4. Submit mixed Hindi/English narrative -> verify graceful handling.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.language.translator import translate_to_english, detect_language
from app.services.forensics.nlp_extractor import extract_entities_from_police_narrative

client = TestClient(app)


def test_scenario_vernacular_hindi_fir():
    # Test 1: Submit a Hindi FIR text
    hindi_narrative = (
        "प्रथम सूचना रिपोर्ट\n"
        "थाना: करोल बाग पुलिस स्टेशन\n"
        "धारा 392 आईपीसी और धारा 397 आईपीसी\n\n"
        "दिनांक 28-10-2026 को समय शाम 7:30 बजे तनिष्क ज्वैलर्स में तीन हथियारबंद आरोपी घुस गए। "
        "गिरोह का मुख्य आरोपी राजन था, जिसने बंदूक तानकर 4 किलो सोना लूटा। "
        "आरोपी का मोबाइल नंबर +919999988888 है और वे वाहन संख्या TS 09 AB 1234 में फरार हो गए।"
    )

    # Verify language detection
    detected = detect_language(hindi_narrative)
    assert detected == "hi"

    # Verify translation
    translated, lang = translate_to_english(hindi_narrative)
    assert lang == "hi"
    assert "Section" in translated or "accused" in translated.lower()
    assert "Rajan" in translated
    assert "TS 09 AB 1234" in translated

    # Test API Upload
    res = client.post(
        "/api/v1/forensics/fir/upload",
        data={
            "case_number": "FIR-2026-HI-01",
            "title": "Hindi Vernacular Jewelry Heist",
            "narrative_text": hindi_narrative,
            "filed_by": "Inspector R. K. Sharma"
        }
    )
    assert res.status_code == 200, f"Hindi FIR upload failed: {res.text}"
    extracted = res.json()["extracted_entities"]
    assert any("Rajan" in s for s in extracted["suspects_identified"])
    assert any("TS 09 AB 1234" in v or "TS09AB1234" in v.replace(" ", "") for v in extracted["vehicles_identified"])
    assert any("99999" in p for p in extracted["phones_identified"])


def test_scenario_vernacular_marathi_fir():
    # Test 2: Submit a Marathi FIR
    marathi_narrative = (
        "पोलीस ठाणे: नवी मुंबई गुन्हे शाखा\n"
        "कलम 420 भादंवि आणि कलम 120B भादंवि\n\n"
        "तक्रारदार यांच्या तक्रारीनुसार संशयित आरोपी रमेश याने बँकेत बनावट कागदपत्रे सादर करून "
        "हवाला द्वारे 50 लाख रुपयांची फसवणूक केली आहे. संशयित रमेश याचा मोबाइल +919876543210 असून "
        "तो घटनास्थळावरून पसार झाला आहे."
    )

    detected = detect_language(marathi_narrative)
    assert detected == "mr"

    translated, lang = translate_to_english(marathi_narrative)
    assert lang == "mr"
    assert "Ramesh" in translated
    assert "Section" in translated or "cheating" in translated.lower()

    entities = extract_entities_from_police_narrative(marathi_narrative)
    assert any("Ramesh" in s for s in entities["suspects_identified"])
    assert any("9876543210" in p for p in entities["phones_identified"])
    assert entities["detected_language"] == "mr"


def test_scenario_vernacular_kannada_fir():
    # Test 3: Submit a Kannada FIR
    kannada_narrative = (
        "ಪ್ರಥಮ ಮಾಹಿತಿ ವರದಿ\n"
        "ಪೊಲೀಸ್ ಠಾಣೆ: ಸೆಂಟ್ರಲ್ ಬೆಂಗಳೂರು\n"
        "ಕಲಂ 392 ಮತ್ತು ಕಲಂ 397\n\n"
        "ದಿನಾಂಕ 25-10-2026 ರಂದು ಆರೋಪಿ ರಾಜನ್ ಬಂದೂಕು ತೋರಿಸಿ ದರೋಡೆ ಮಾಡಿದ್ದಾನೆ. "
        "ಶಂಕಿತ ರಾಜನ್ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ +919999988888 ಹೊಂದಿದ್ದು, ಪರಾರಿ ಆಗಿದ್ದಾನೆ."
    )

    detected = detect_language(kannada_narrative)
    assert detected == "kn"

    translated, lang = translate_to_english(kannada_narrative)
    assert lang == "kn"
    assert "Rajan" in translated

    entities = extract_entities_from_police_narrative(kannada_narrative)
    assert any("Rajan" in s for s in entities["suspects_identified"])
    assert any("99999" in p for p in entities["phones_identified"])
    assert entities["detected_language"] == "kn"


def test_scenario_vernacular_mixed_hinglish_fir():
    # Test 4: Submit mixed Hindi/English (Hinglish) narrative
    hinglish_narrative = (
        "Complainant reported that accused Suresh along with another suspect entered the premise. "
        "Unhone pistol dikhakar cash chori kiya. Suspect Suresh ka mobile +919123456789 hai. "
        "The accused fled in dark SUV."
    )

    entities = extract_entities_from_police_narrative(hinglish_narrative)
    assert any("Suresh" in s for s in entities["suspects_identified"])
    assert any("9123456789" in p for p in entities["phones_identified"])
