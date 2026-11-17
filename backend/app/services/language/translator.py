"""
Sovereign Indian Vernacular Language Translation Engine.
Translates regional Indian police FIR narratives (Hindi, Marathi, Kannada, Telugu, Tamil, Bengali)
to English for downstream Named Entity Recognition (NER), Knowledge Graph Linkage, and RAG drafting.

Architecture:
1. Primary: deep-translator (GoogleTranslator(source='auto', target='en'))
2. Redis Caching: In-memory/Redis cache hash keying to prevent redundant translations.
3. Offline Fallback: HuggingFace transformers pipeline with Helsinki-NLP/opus-mt-hi-en
4. Resilient Sovereign Lexicon: Normalizes Indic numerals (0-9), legal terms, and proper names.
"""

import re
import hashlib
import logging
from typing import Optional, Tuple
from app.services.language.bhashini_client import get_bhashini_client

logger = logging.getLogger("crimenexus.language.translator")

# In-memory LRU / Redis cache simulator
_TRANSLATION_CACHE = {}

# Lazy-loaded offline transformers pipeline
_OFFLINE_TRANSLATOR = None


def _get_cache_key(text: str, target: str) -> str:
    return hashlib.sha256(f"{target}:{text.strip()}".encode("utf-8")).hexdigest()


def _get_redis_client():
    try:
        from app.services.streaming.redis_streams import get_redis_client
        return get_redis_client()
    except Exception:
        return None


def get_cached_translation(text: str, target_lang: str = "en") -> Optional[str]:
    key = _get_cache_key(text, target_lang)
    # Check in-memory first
    if key in _TRANSLATION_CACHE:
        return _TRANSLATION_CACHE[key]

    # Check Redis
    r = _get_redis_client()
    if r:
        try:
            val = r.get(f"trans:{key}")
            if val:
                decoded = val.decode("utf-8") if isinstance(val, bytes) else str(val)
                _TRANSLATION_CACHE[key] = decoded
                return decoded
        except Exception as exc:
            logger.debug("Redis cache get skipped: %s", exc)
    return None


def set_cached_translation(text: str, target_lang: str, translated: str):
    key = _get_cache_key(text, target_lang)
    _TRANSLATION_CACHE[key] = translated
    r = _get_redis_client()
    if r:
        try:
            r.setex(f"trans:{key}", 86400 * 7, translated)  # Cache for 7 days
        except Exception as exc:
            logger.debug("Redis cache set skipped: %s", exc)


def get_offline_huggingface_translator():
    """Lazy loads Helsinki-NLP/opus-mt-hi-en offline translation model without network stalls."""
    global _OFFLINE_TRANSLATOR
    if _OFFLINE_TRANSLATOR is not None:
        return _OFFLINE_TRANSLATOR

    try:
        from transformers import pipeline
        _OFFLINE_TRANSLATOR = pipeline("translation", model="Helsinki-NLP/opus-mt-hi-en", local_files_only=True)
        return _OFFLINE_TRANSLATOR
    except Exception as exc:
        logger.debug("Helsinki-NLP offline local model not available: %s", exc)
        return None


# Vernacular Indic Script Unicode Ranges
INDIC_SCRIPTS = {
    "hi": (0x0900, 0x097F),  # Devanagari (Hindi)
    "mr": (0x0900, 0x097F),  # Devanagari (Marathi)
    "bn": (0x0980, 0x09FF),  # Bengali
    "ta": (0x0B80, 0x0BFF),  # Tamil
    "te": (0x0C00, 0x0C7F),  # Telugu
    "kn": (0x0C80, 0x0CFF),  # Kannada
}

INDIC_DIGIT_MAP = {
    '\u0966': '0', '\u0967': '1', '\u0968': '2', '\u0969': '3', '\u096A': '4',
    '\u096B': '5', '\u096C': '6', '\u096D': '7', '\u096E': '8', '\u096F': '9',
    '\u0CE6': '0', '\u0CE7': '1', '\u0CE8': '2', '\u0CE9': '3', '\u0CEA': '4',
    '\u0CEB': '5', '\u0CEC': '6', '\u0CED': '7', '\u0CEE': '8', '\u0CEF': '9',
    '\u0C66': '0', '\u0C67': '1', '\u0C68': '2', '\u0C69': '3', '\u0C6A': '4',
    '\u0C6B': '5', '\u0C6C': '6', '\u0C6D': '7', '\u0C6E': '8', '\u0C6F': '9',
}

POLICE_VERNACULAR_LEXICON = {
    "प्रथम सूचना रिपोर्ट": "FIRST INFORMATION REPORT",
    "प्राथमिकी": "FIR",
    "आरोपी": "accused",
    "संशयित": "suspect",
    "संदिग्ध": "suspect",
    "शिकायतकर्ता": "complainant",
    "वादी": "complainant",
    "गवाह": "witness",
    "साक्षी": "witness",
    "चोरी": "theft",
    "डकैती": "dacoity",
    "दरोडा": "armed robbery",
    "लूट": "robbery",
    "हत्या": "murder",
    "धोखाधड़ी": "cheating fraud",
    "हवाला": "hawala",
    "रिश्वत": "bribery",
    "अपहरण": "kidnapping",
    "बंदूक": "firearm gun",
    "पिस्तौल": "firearm pistol",
    "हथियार": "weapon",
    "गाड़ी": "vehicle",
    "कार": "car",
    "नंबर": "number",
    "मोबाइल": "mobile phone",
    "फोन": "phone",
    "खाता": "bank account",
    "रुपये": "rupees",
    "रुपया": "rupees",
    "रुपयांची": "rupees",
    "रुपयांचा": "rupees",
    "धारा": "Section",
    "कलम": "Section",
    "थाना": "Police Station",
    "ठाणे": "Police Station",
    "पोलीस ठाणे": "Police Station",
    "कोतवाली": "Police Station",
    "चौकी": "Police Post",
    "भादंवि": "IPC",
    "तक्रारदार": "complainant",
    "तक्रारीनुसार": "as per complaint",
    "फसवणूक": "cheating fraud",
    "गुन्हे शाखा": "Crime Branch",
    "बनावट": "counterfeit fake forged",
    "कागदपत्रे": "documents",
    "पसार": "absconding fugitive",
    "फरार": "absconding fugitive",
    "भाग गया": "fled escaped",
    "ವಂಚನೆ": "cheating fraud",
    "ಕೊಲೆ": "murder",
    "ದರೋಡೆ": "robbery dacoity",
    "ಕಳ್ಳತನ": "theft",
    "ಆರೋಪಿ": "accused suspect",
    "ದೂರುದಾರ": "complainant victim",
    "ಸಾಕ್ಷಿ": "witness",
    "ವಾಹನ": "vehicle",
    "ಕಾರು": "car",
    "ಸಂಖ್ಯೆ": "number",
    "ಮೊಬೈಲ್": "mobile phone",
    "ದೂರವಾಣಿ": "phone",
    "ಬ್ಯಾಂಕ್ ಖಾತೆ": "bank account",
    "ರೂಪಾಯಿ": "rupees",
    "ಕಲಂ": "Section",
    "ಠಾಣೆ": "Police Station",
    "ಪರಾರಿ": "absconding fugitive",
    "ಓಡಿಹೋದನು": "fled escaped",
}

NAME_TRANSLITERATION_MAP = {
    "राजन": "Rajan",
    "रमेश": "Ramesh",
    "सुरेश": "Suresh",
    "विक्रम": "Vikram",
    "मल्होत्रा": "Malhotra",
    "खत्री": "Khatri",
    "शर्मा": "Sharma",
    "वर्मा": "Verma",
    "सिंह": "Singh",
    "यादव": "Yadav",
    "ಕುಮಾರ್": "Kumar",
    "ರಮೇಶ್": "Ramesh",
    "ರಾಜನ್": "Rajan",
    "ಸುರೇಶ್": "Suresh",
    "ವಿಕ್ರಮ್": "Vikram",
}


def normalize_indic_digits(text: str) -> str:
    """Replaces regional script numerals with standard Arabic numbers 0-9."""
    for ind_char, eng_char in INDIC_DIGIT_MAP.items():
        if ind_char in text:
            text = text.replace(ind_char, eng_char)
    return text


def detect_language(text: str) -> str:
    """Detects if text is primarily English or a regional Indic language."""
    if not text:
        return "en"

    # 1. Non-Devanagari regional Indic scripts
    for char in text:
        code = ord(char)
        if 0x0C80 <= code <= 0x0CFF:
            return "kn"  # Kannada
        elif 0x0C00 <= code <= 0x0C7F:
            return "te"  # Telugu
        elif 0x0B80 <= code <= 0x0BFF:
            return "ta"  # Tamil
        elif 0x0980 <= code <= 0x09FF:
            return "bn"  # Bengali

    # 2. Devanagari block (distinguish Marathi from Hindi)
    has_devanagari = any(0x0900 <= ord(c) <= 0x097F for c in text)
    if has_devanagari:
        # Check for Marathi-specific letter ळ (U+0933)
        if '\u0933' in text:
            return "mr"

        # Check distinctive Marathi police, legal, and grammatical markers
        marathi_markers = [
            "भादंवि", "ठाणे", "तक्रारदार", "तक्रारीनुसार", "गुन्हे शाखा",
            "फसवणूक", "कागदपत्रे", "याने", "याचा", "यांची", "यांना",
            "केली आहे", "पसार झाला", "झाला आहे"
        ]
        if any(marker in text for marker in marathi_markers):
            return "mr"

        try:
            from langdetect import detect
            lang = detect(text)
            if lang in ["mr", "hi"]:
                return lang
        except Exception:
            pass

        return "hi"  # Default Devanagari to Hindi

    try:
        from langdetect import detect
        lang = detect(text)
        if lang in ["hi", "mr", "kn", "te", "ta", "bn"]:
            return lang
    except Exception:
        pass

    return "en"


import urllib.request
import urllib.parse
import json

def translate_via_google_free(text: str, source_lang: str = "auto", target_lang: str = "en") -> Tuple[str, str]:
    """
    Translates text using high-reliability Google Translate open/free endpoints:
    Primary: https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl={sl}&tl={tl}&q={text}
    Fallback: https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl={sl}&tl={tl}&dt=t&q={text}
    Returns: (translated_text, detected_language)
    """
    if not text or not text.strip():
        return ("", source_lang if source_lang != "auto" else target_lang)

    clean_text = text.strip()
    sl = source_lang or "auto"
    tl = target_lang or "en"

    # Check cache first
    cached = get_cached_translation(clean_text, tl)
    if cached:
        return (cached, sl)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*"
    }

    # 1. Primary Endpoint: clients5.google.com dict-chrome-ex
    try:
        encoded_query = urllib.parse.quote(clean_text)
        url = f"https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl={sl}&tl={tl}&q={encoded_query}"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                body = resp.read().decode("utf-8")
                data = json.loads(body)
                if isinstance(data, list) and len(data) > 0:
                    first = data[0]
                    if isinstance(first, list) and len(first) > 0:
                        trans = str(first[0])
                        detected = str(first[1]) if len(first) > 1 and isinstance(first[1], str) else sl
                        if trans and trans.strip():
                            set_cached_translation(clean_text, tl, trans)
                            return (trans, detected)
                    elif isinstance(first, str) and first.strip():
                        set_cached_translation(clean_text, tl, first)
                        return (first, sl)
    except Exception as exc:
        logger.debug("[GOOGLE_FREE_PRIMARY] Primary translation error: %s", exc)

    # 2. Fallback Endpoint: translate.googleapis.com
    try:
        encoded_query = urllib.parse.quote(clean_text)
        url = f"https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl={sl}&tl={tl}&dt=t&q={encoded_query}"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                body = resp.read().decode("utf-8")
                data = json.loads(body)
                if isinstance(data, list) and len(data) > 0:
                    first = data[0]
                    if isinstance(first, list) and len(first) > 0:
                        parts = [chunk[0] for chunk in first if isinstance(chunk, list) and len(chunk) > 0 and chunk[0]]
                        trans = "".join(parts)
                        detected = data[2] if len(data) > 2 and isinstance(data[2], str) else sl
                        if trans and trans.strip():
                            set_cached_translation(clean_text, tl, trans)
                            return (trans, detected)
    except Exception as exc:
        logger.debug("[GOOGLE_FREE_FALLBACK] Fallback translation error: %s", exc)

    return ("", sl)


def translate_text(text: str, target_lang: str = "en", source_lang: str = "auto") -> Tuple[str, str]:
    """
    Translates text between arbitrary language pairs (e.g. English -> Hindi, Marathi -> English).
    Returns (translated_text, detected_language).
    """
    if not text or not text.strip():
        return ("", source_lang)

    if source_lang != "auto" and source_lang == target_lang:
        return (text, source_lang)

    # 1. Google Translate Free API
    trans, detected = translate_via_google_free(text, source_lang=source_lang, target_lang=target_lang)
    if trans and trans.strip():
        return (trans, detected)

    # 2. If target is English, fall back to sovereign Indic pipeline
    if target_lang == "en":
        return translate_to_english(text, source_lang=source_lang if source_lang != "auto" else None)

    return (text, source_lang)


def translate_to_english(text: str, source_lang: Optional[str] = None) -> Tuple[str, str]:
    """
    Translates an Indian regional vernacular police narrative into English.
    Returns (translated_text, detected_language).
    Pipeline:
    1. Check Cache
    2. Google Translate Free API (Primary)
    3. Deep-Translator (GoogleTranslator)
    4. Offline Helsinki-NLP / Bhashini / Sovereign Police Lexicon
    """
    if not text or not text.strip():
        return ("", "en")

    lang = source_lang or detect_language(text)
    if lang == "en":
        return (text, "en")

    # 1. Check Redis / Memory Cache
    cached = get_cached_translation(text, "en")
    if cached:
        return (cached, lang)

    # 2. Google Translate Free API (Primary)
    google_trans, detected = translate_via_google_free(text, source_lang=lang or "auto", target_lang="en")
    if google_trans and google_trans.strip():
        set_cached_translation(text, "en", google_trans)
        return (google_trans, detected if detected != "auto" else lang)

    # 3. Try deep-translator (GoogleTranslator)
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source="auto", target="en")
        translated = translator.translate(text)
        if translated and len(translated.strip()) > 0:
            set_cached_translation(text, "en", translated)
            return (translated, lang)
    except Exception as exc:
        logger.debug("[DEEP_TRANSLATOR] Online translation failed: %s. Attempting offline fallback.", exc)

    # 4. Offline Fallback: HuggingFace transformers (Helsinki-NLP/opus-mt-hi-en)
    if lang in ["hi", "mr"]:
        try:
            hf_trans = get_offline_huggingface_translator()
            if hf_trans:
                res = hf_trans(text)
                if res and isinstance(res, list) and "translation_text" in res[0]:
                    out_text = res[0]["translation_text"]
                    set_cached_translation(text, "en", out_text)
                    return (out_text, lang)
        except Exception as exc:
            logger.debug("[HUGGINGFACE_TRANSLATE] Offline translation failed: %s", exc)

    # 5. Check Government Bhashini API
    bhashini = get_bhashini_client()
    bhashini_result = bhashini.translate(text, source_lang=lang, target_lang="en")
    if bhashini_result:
        set_cached_translation(text, "en", bhashini_result)
        return (bhashini_result, lang)

    # 6. Sovereign Lexicon Translation Fallback
    norm_text = normalize_indic_digits(text)
    for vernacular_name, english_name in NAME_TRANSLITERATION_MAP.items():
        norm_text = re.sub(re.escape(vernacular_name), english_name, norm_text)
    for vern_term, eng_term in POLICE_VERNACULAR_LEXICON.items():
        norm_text = re.sub(re.escape(vern_term), eng_term, norm_text)

    norm_text = re.sub(r'(?i)\bSection\s*([0-9]{1,4})\s*(?:IPC|BNS)?', r'Section \1 IPC', norm_text)

    set_cached_translation(text, "en", norm_text)
    return (norm_text, lang)
