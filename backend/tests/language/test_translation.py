import pytest
from app.services.language.translator import (
    translate_via_google_free,
    translate_text,
    translate_to_english,
    detect_language
)
from app.api.language_router import translate, TranslationRequest, list_supported_languages

def test_detect_language_indic():
    assert detect_language("अभियुक्त फरार हो गया") in ["hi", "mr"]
    assert detect_language("ನಿನ್ನೆ ರಾತ್ರಿ ಕಳ್ಳತನ ನಡೆದಿದೆ") == "kn"
    assert detect_language("The accused escaped") == "en"

def test_google_translate_free_to_english():
    hi_text = "अभियुक्त ने बैंक से पचास हजार रुपये निकाले और भाग गया।"
    trans, lang = translate_via_google_free(hi_text, source_lang="auto", target_lang="en")
    assert len(trans) > 0
    assert any(w in trans.lower() for w in ["accused", "bank", "rupees", "thousand", "withdrew", "fled", "ran away"])

def test_google_translate_free_english_to_vernacular():
    eng_text = "The police caught the suspect."
    trans_hi, _ = translate_text(eng_text, target_lang="hi", source_lang="en")
    assert len(trans_hi) > 0

    trans_te, _ = translate_text(eng_text, target_lang="te", source_lang="en")
    assert len(trans_te) > 0

    trans_mr, _ = translate_text(eng_text, target_lang="mr", source_lang="en")
    assert len(trans_mr) > 0

    trans_kn, _ = translate_text(eng_text, target_lang="kn", source_lang="en")
    assert len(trans_kn) > 0

def test_language_router_api():
    # Single translation
    req = TranslationRequest(
        text="अभियुक्त फरार हो गया",
        target_lang="en",
        source_lang="auto"
    )
    res = translate(req)
    assert res.target_lang == "en"
    assert len(res.translated_text) > 0
    assert "abscond" in res.translated_text.lower() or "fled" in res.translated_text.lower() or "escaped" in res.translated_text.lower() or "ran" in res.translated_text.lower()

    # Batch translation
    batch_req = TranslationRequest(
        texts=["Police Station", "Accused", "Complainant"],
        target_lang="hi",
        source_lang="en"
    )
    batch_res = translate(batch_req)
    assert len(batch_res.translations) == 3
    assert all(len(t) > 0 for t in batch_res.translations)

    # Supported languages
    supported = list_supported_languages()
    assert len(supported["languages"]) >= 10
    codes = [l["code"] for l in supported["languages"]]
    assert "en" in codes
    assert "hi" in codes
    assert "mr" in codes
    assert "te" in codes
    assert "kn" in codes
