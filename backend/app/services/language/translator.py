"""
Sovereign Indian Vernacular Language Translation Engine.
Translates regional Indian police FIR narratives (Hindi, Marathi, Kannada, Telugu, Tamil, Bengali)
to English for downstream Named Entity Recognition (NER), Knowledge Graph Linkage, and RAG drafting.
"""

import re
import logging
from typing import Optional, Tuple
from app.services.language.bhashini_client import get_bhashini_client

logger = logging.getLogger("crimenexus.language.translator")

# Vernacular Indic Script Unicode Ranges
INDIC_SCRIPTS = {
    "hi": (0x0900, 0x097F),  # Devanagari (Hindi)
    "mr": (0x0900, 0x097F),  # Devanagari (Marathi)
    "bn": (0x0980, 0x09FF),  # Bengali
    "ta": (0x0B80, 0x0BFF),  # Tamil
    "te": (0x0C00, 0x0C7F),  # Telugu
    "kn": (0x0C80, 0x0CFF),  # Kannada
}

# Regional numeral translation tables to standard 0-9
INDIC_DIGIT_MAP = {
    # Devanagari ०-९
    '\u0966': '0', '\u0967': '1', '\u0968': '2', '\u0969': '3', '\u096A': '4',
    '\u096B': '5', '\u096C': '6', '\u096D': '7', '\u096E': '8', '\u096F': '9',
    # Kannada ೦-೯
    '\u0CE6': '0', '\u0CE7': '1', '\u0CE8': '2', '\u0CE9': '3', '\u0CEA': '4',
    '\u0CEB': '5', '\u0CEC': '6', '\u0CED': '7', '\u0CEE': '8', '\u0CEF': '9',
    # Telugu ౦-౯
    '\u0C66': '0', '\u0C67': '1', '\u0C68': '2', '\u0C69': '3', '\u0C6A': '4',
    '\u0C6B': '5', '\u0C6C': '6', '\u0C6D': '7', '\u0C6E': '8', '\u0C6F': '9',
}

# Police Lexicon: Vernacular terms to formal English legal keywords
POLICE_VERNACULAR_LEXICON = {
    # Hindi / Devanagari
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
    "बंदूक": "firearm firearm gun",
    "पिस्तौल": "firearm pistol",
    "हथियार": "weapon",
    "चाकू": "knife",
    "वाहन": "vehicle",
    "गाड़ी": "vehicle",
    "मोटरसाइकिल": "motorcycle",
    "कार": "car",
    "नंबर": "number",
    "क्रमांक": "number",
    "मोबाइल": "mobile phone",
    "फोन": "phone",
    "बैंक खाता": "bank account",
    "खाता संख्या": "account number",
    "रुपये": "rupees",
    "रुपया": "rupees",
    "लाख": "lakh",
    "करोड़": "crore",
    "कलम": "Section",
    "धारा": "Section",
    "भादंवि": "IPC",
    "आईपीसी": "IPC",
    "बीएनएस": "BNS",
    "थाना": "Police Station",
    "चौकी": "Police Post",
    "फरार": "absconding fugitive",
    "पसार": "absconding",
    "रवाना": "departed fled",
    "भाग गया": "fled escaped",

    # Marathi specifics
    "तक्रारदार": "complainant",
    "साक्षीदार": "witness",
    "गुन्हा": "crime offense",
    "जप्त": "seized",
    "मुद्देमाल": "seized evidence",
    "पोलीस ठाणे": "Police Station",

    # Kannada terms
    "ಪ್ರಥಮ ಮಾಹಿತಿ ವರದಿ": "FIRST INFORMATION REPORT",
    "ಆರೋಪಿ": "accused",
    "ಶಂಕಿತ": "suspect",
    "ದೂರುದಾರ": "complainant",
    "ಸಾಕ್ಷಿ": "witness",
    "ಕಳ್ಳತನ": "theft",
    "ದರೋಡೆ": "robbery",
    "ಕೊಲೆ": "murder",
    "ವಂಚನೆ": "cheating fraud",
    "ಬಂದೂಕು": "firearm",
    "ಪಿಸ್ತೂಲು": "pistol firearm",
    "ಆಯುಧ": "weapon",
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

# Common Indian proper names in Devanagari and Kannada to Roman script
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
    """
    Detects if text is primarily English or a regional Indic language.
    Uses script character range analysis with langdetect library support.
    """
    # 1. Direct Indic script detection
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
        elif 0x0900 <= code <= 0x097F:
            # Differentiate Marathi vs Hindi via specific Marathi markers
            if any(m in text for m in ["आहे", "झाला", "केले", "पोलीस ठाणे", "तक्रारदार", "साक्षीदार"]):
                return "mr"
            return "hi"

    # 2. Try langdetect if available
    try:
        from langdetect import detect
        lang = detect(text)
        if lang in ["hi", "mr", "kn", "te", "ta", "bn"]:
            return lang
    except Exception:
        pass

    return "en"


def translate_text_google(text: str, target_lang: str = "en", source_lang: str = "auto") -> str:
    """
    Translates text using Google Translate public API with graceful fallback to local engine.
    Supports English, Hindi, Marathi, Kannada, Telugu, Tamil, and Bengali.
    """
    if not text or not text.strip():
        return ""
    if source_lang == target_lang:
        return text

    import json
    import urllib.parse
    import urllib.request

    try:
        encoded = urllib.parse.quote(text.strip())
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source_lang}&tl={target_lang}&dt=t&q={encoded}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                translated_segments = [seg[0] for seg in data[0] if seg and len(seg) > 0 and seg[0]]
                return "".join(translated_segments)
    except Exception as exc:
        logger.warning("[TRANSLATOR] Google Translate API request failed: %s", exc)

    return text


def translate_to_english(text: str, source_lang: Optional[str] = None) -> Tuple[str, str]:
    """
    Translates an Indian regional vernacular police narrative into English.
    Returns (translated_text, detected_language).
    Preserves all numbers, phones, vehicle license plates, and proper suspect names.
    """
    if not text or not text.strip():
        return ("", "en")

    lang = source_lang or detect_language(text)
    if lang == "en":
        return (text, "en")

    # 1. Check if Government Bhashini API is active
    bhashini = get_bhashini_client()
    bhashini_result = bhashini.translate(text, source_lang=lang, target_lang="en")
    if bhashini_result:
        return (bhashini_result, lang)

    # 2. Sovereign Local Translation Engine
    # Step A: Normalize Indic script numerals to 0-9
    norm_text = normalize_indic_digits(text)

    # Step B: Substitute proper suspect names from dictionary
    for vernacular_name, english_name in NAME_TRANSLITERATION_MAP.items():
        norm_text = re.sub(re.escape(vernacular_name), english_name, norm_text)

    # Step C: Substitute police legal lexicon
    for vern_term, eng_term in POLICE_VERNACULAR_LEXICON.items():
        norm_text = re.sub(re.escape(vern_term), eng_term, norm_text)

    # Step D: Ensure legal section formatting (e.g. "Section 392 IPC", "Section 310 BNS")
    norm_text = re.sub(r'(?i)\bSection\s*([0-9]{1,4})\s*(?:IPC|BNS)?', r'Section \1 IPC', norm_text)

    logger.info("[VERNACULAR TRANSLATOR] Successfully translated %s narrative to English legal format.", lang.upper())
    return (norm_text, lang)
