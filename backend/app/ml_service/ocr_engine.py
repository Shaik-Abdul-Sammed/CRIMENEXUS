import io
import logging
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

logger = logging.getLogger("crimenexus.ml.ocr")


def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """
    Applies image preprocessing filters to optimize noisy, scanned police FIR documents:
    Converts to grayscale, enhances contrast, and applies mild sharpening.
    """
    # 1. Convert to grayscale
    gray = image.convert("L")
    # 2. Enhance contrast
    enhancer = ImageEnhance.Contrast(gray)
    enhanced = enhancer.enhance(1.8)
    # 3. Sharpen edges
    sharpened = enhanced.filter(ImageFilter.SHARPEN)
    return sharpened


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    """
    Extracts plain text from scanned FIR image bytes (PNG, JPEG, TIFF, BMP)
    using Tesseract OCR engine.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        processed = preprocess_image_for_ocr(image)
        text = pytesseract.image_to_string(processed, lang="eng")
        return text.strip()
    except Exception as exc:
        logger.error("OCR extraction failed from image bytes: %s", exc)
        return ""


def extract_text_from_scanned_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts text from scanned image-based PDF documents by converting each page
    into a high-resolution pixmap and running Tesseract OCR.
    """
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        extracted_pages = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Try native text extraction first
            page_text = page.get_text()
            if page_text and len(page_text.strip()) > 30:
                extracted_pages.append(page_text.strip())
            else:
                # Scanned image page: render pixmap at 2x resolution for OCR
                pix = page.get_pixmap(dpi=200)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                processed = preprocess_image_for_ocr(img)
                ocr_text = pytesseract.image_to_string(processed, lang="eng")
                if ocr_text.strip():
                    extracted_pages.append(ocr_text.strip())
        return "\n\n".join(extracted_pages)
    except Exception as exc:
        logger.warning("Scanned PDF OCR fallback failed: %s", exc)
        return ""


def check_tesseract_availability() -> bool:
    """Verifies that Tesseract OCR binary and libraries are operational."""
    try:
        ver = pytesseract.get_tesseract_version()
        return ver is not None
    except Exception:
        return False
