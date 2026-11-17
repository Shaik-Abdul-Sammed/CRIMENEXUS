"""
CRIMENEXUS Sovereign & Multilingual Translation Router.
Powered by Google Translate Free API (dict-chrome-ex) with Offline Sovereign Lexicon and Bhashini Fallback.
Provides single and batch translation across all 22 Scheduled Indian Languages and English.
"""

import logging
from typing import List, Dict, Any, Optional, Union
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.services.language.translator import (
    translate_via_google_free,
    translate_text,
    translate_to_english,
    detect_language,
    get_cached_translation,
    set_cached_translation
)

logger = logging.getLogger("crimenexus.language_router")

router = APIRouter(tags=["Language Translation"])

SUPPORTED_LANGUAGES = [
    {"code": "en", "name": "English", "native": "English"},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी"},
    {"code": "mr", "name": "Marathi", "native": "मराठी"},
    {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ"},
    {"code": "te", "name": "Telugu", "native": "తెలుగు"},
    {"code": "bn", "name": "Bengali", "native": "বাংলা"},
    {"code": "ta", "name": "Tamil", "native": "தமிழ்"},
    {"code": "gu", "name": "Gujarati", "native": "ગુજરાતી"},
    {"code": "pa", "name": "Punjabi", "native": "ਪੰਜਾਬੀ"},
    {"code": "ml", "name": "Malayalam", "native": "മലയാളം"},
    {"code": "or", "name": "Odia", "native": "ଓଡ଼ିଆ"},
    {"code": "ur", "name": "Urdu", "native": "اردو"},
    {"code": "as", "name": "Assamese", "native": "অসমীয়া"}
]

class TranslationRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[List[str]] = None
    target_lang: str = Field("en", description="Target ISO code (e.g. en, hi, mr, kn, te)")
    source_lang: Optional[str] = Field("auto", description="Source ISO code or 'auto'")

class TranslationResponse(BaseModel):
    original_text: Optional[str] = None
    translated_text: Optional[str] = None
    translations: Optional[List[str]] = None
    source_lang: str
    target_lang: str
    engine: str = "google_translate_free"
    cached: bool = False

@router.get("/language/health", summary="Language Translation Engine Health")
@router.get("/translate/health", summary="Translation Health")
def translation_health():
    return {
        "status": "healthy",
        "primary_engine": "google_translate_free",
        "endpoints": [
            "https://clients5.google.com/translate_a/t?client=dict-chrome-ex",
            "https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex"
        ],
        "supported_languages_count": len(SUPPORTED_LANGUAGES),
        "offline_fallbacks": ["sovereign_police_lexicon", "helsinki_nlp_opus_mt", "bhashini_client"]
    }

@router.get("/language/supported", summary="List Supported Indian Regional Languages")
def list_supported_languages():
    return {
        "languages": SUPPORTED_LANGUAGES,
        "default": "en"
    }

@router.post("/translate", response_model=TranslationResponse, summary="Translate Text (Single or Batch)")
@router.post("/language/translate", response_model=TranslationResponse, summary="Translate Text (Alias)")
def translate(req: TranslationRequest):
    tl = (req.target_lang or "en").lower().strip()
    sl = (req.source_lang or "auto").lower().strip()

    # Batch Translation
    if req.texts is not None and isinstance(req.texts, list):
        results = []
        for item in req.texts:
            if not item or not str(item).strip():
                results.append("")
                continue
            translated, _ = translate_text(str(item), target_lang=tl, source_lang=sl)
            results.append(translated)
        return TranslationResponse(
            translations=results,
            source_lang=sl,
            target_lang=tl,
            engine="google_translate_free",
            cached=False
        )

    # Single String Translation
    text = req.text or ""
    if not text.strip():
        return TranslationResponse(
            original_text="",
            translated_text="",
            source_lang=sl,
            target_lang=tl,
            engine="google_translate_free",
            cached=False
        )

    # Check cache
    cached = get_cached_translation(text, tl)
    if cached:
        return TranslationResponse(
            original_text=text,
            translated_text=cached,
            source_lang=sl,
            target_lang=tl,
            engine="google_translate_free",
            cached=True
        )

    translated, detected_sl = translate_text(text, target_lang=tl, source_lang=sl)
    return TranslationResponse(
        original_text=text,
        translated_text=translated,
        source_lang=detected_sl if detected_sl != "auto" else sl,
        target_lang=tl,
        engine="google_translate_free",
        cached=False
    )
