import pytest
from app.services.forensics.intercept_translator import InterceptTranslator, get_intercept_translator
from app.api.intercept_translate import intercept_health, get_slang_glossary, translate_intercept, TranslateRequest

def test_intercept_translator_happy_path_slang():
    """Happy Path: Translates transcript with multiple criminal argot keywords (ghoda, khoka, thokna)."""
    translator = get_intercept_translator()
    raw = "Bhai ne bola do ghoda aur ek khoka leke aao, usko thokna hai"
    res = translator.decode_and_translate(raw, source_language="HINDI_URDU")
    assert res["slang_detected_count"] >= 3
    tokens = [s["argot_token"] for s in res["detected_slang"]]
    assert "ghoda" in tokens
    assert "khoka" in tokens
    assert "thokna" in tokens
    assert "BSA Sec 65B" in res["translated_transcript"]

def test_intercept_translator_clean_text_edge_case():
    """Edge Case: Benign conversation with zero underworld slang."""
    translator = InterceptTranslator()
    raw = "Meeting scheduled at Connaught Place coffee shop at 4 PM"
    res = translator.decode_and_translate(raw, source_language="ENGLISH")
    assert res["slang_detected_count"] == 0
    assert len(res["detected_slang"]) == 0

def test_intercept_api_endpoints():
    """API Validation: Checks health endpoint, glossary retrieval, and POST translation."""
    health = intercept_health()
    assert health["status"] == "healthy"
    
    glossary = get_slang_glossary()
    assert "ghoda" in glossary
    assert "khoka" in glossary
    
    req = TranslateRequest(transcript="Ek dabba do", source_language="HINDI")
    res = translate_intercept(req)
    assert res["slang_detected_count"] == 1
    assert res["detected_slang"][0]["argot_token"] == "dabba"
