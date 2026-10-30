import re
from typing import Optional


def sanitize_phone_number(phone: str) -> Optional[str]:
    """Extract standard 10-digit Indian phone number."""
    if not phone:
        return None
    cleaned = re.sub(r"[^\d]", "", phone)
    if len(cleaned) == 12 and cleaned.startswith("91"):
        cleaned = cleaned[2:]
    if len(cleaned) == 10 and cleaned[0] in "6789":
        return cleaned
    return None


def sanitize_vehicle_plate(plate: str) -> Optional[str]:
    """Standardize Indian vehicle registration plate."""
    if not plate:
        return None
    clean = re.sub(r"[^A-Za-z0-9]", "", plate).upper()
    if 8 <= len(clean) <= 10:
        return clean
    return clean if clean else None


def clean_text_narrative(text: str) -> str:
    """Normalize whitespace and strip control characters."""
    if not text:
        return ""
    return " ".join(text.split())
