"""
Enhanced OCR Preprocessing & Multi-Page Document Text Extraction.
Handles scanned, noisy, low-contrast, or skewed police FIRs.
Features:
- Tesseract binary availability checking
- Grayscale conversion
- Otsu's automatic thresholding / binarization
- Automatic document deskewing via Hough Lines / minAreaRect angle detection
- Multi-page PDF text extraction iterating through each page with PyMuPDF and OCR fallback
"""

import io
import math
import shutil
import logging
from typing import Any, Union
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

logger = logging.getLogger("crimenexus.ml.ocr")


def check_tesseract_availability() -> bool:
    """Checks if the Tesseract binary is installed and available in the system PATH."""
    return shutil.which("tesseract") is not None


def deskew_image_cv2(image_np: np.ndarray) -> np.ndarray:
    """
    Deskews a rotated document image using OpenCV minAreaRect or Hough transform.
    Falls back gracefully to original image if opencv is not available or angle is minimal.
    """
    try:
        import cv2
        gray = image_np if len(image_np.shape) == 2 else cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        # Invert colors so text is white on black background
        inv = cv2.bitwise_not(gray)
        # Threshold to isolate text blocks
        thresh = cv2.threshold(inv, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

        # Calculate coordinates of non-zero pixels
        coords = np.column_stack(np.where(thresh > 0))
        if len(coords) < 50:
            return image_np

        angle = cv2.minAreaRect(coords)[-1]
        # Normalize angle
        if angle < -45:
            angle = -(90 + angle)
        elif angle > 45:
            angle = 90 - angle
        else:
            angle = -angle

        # If angle is negligible (< 0.5 degrees), do not rotate
        if abs(angle) < 0.5:
            return image_np

        (h, w) = image_np.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image_np, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )
        return rotated
    except Exception as exc:
        logger.debug("OpenCV deskewing skipped: %s", exc)
        return image_np


def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """
    Applies OpenCV & PIL image preprocessing pipeline:
    1. Grayscale conversion
    2. Document deskewing
    3. OpenCV Otsu binarization / thresholding
    4. Contrast enhancement
    If OpenCV or any step fails, gracefully falls back to PIL enhancements or raw image.
    """
    try:
        import cv2
        # Convert PIL to numpy array
        img_np = np.array(image)

        # Convert to grayscale
        if len(img_np.shape) == 3:
            gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_np

        # Deskew document orientation
        deskewed = deskew_image_cv2(gray)

        # Otsu's thresholding / binarization
        _, thresh = cv2.threshold(deskewed, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

        # Return back as PIL Image
        return Image.fromarray(thresh)
    except Exception as exc:
        logger.debug("OpenCV preprocessing failed: %s; attempting PIL contrast fallback", exc)
        try:
            gray = image.convert("L")
            enhancer = ImageEnhance.Contrast(gray)
            enhanced = enhancer.enhance(2.0)
            return enhanced.filter(ImageFilter.SHARPEN)
        except Exception as pil_exc:
            logger.debug("PIL contrast fallback failed: %s; returning raw original image", pil_exc)
            return image


def extract_text_from_image(image_input: Any) -> str:
    """
    Extracts text from an image input (PIL Image, image bytes, file path, or file-like object)
    using Tesseract OCR.
    Applies preprocessing (grayscale, Otsu thresholding, deskewing) with graceful fallback
    to the raw image if OpenCV fails.
    """
    if not check_tesseract_availability():
        logger.warning("Tesseract OCR binary not found in system PATH. Returning empty string.")
        return ""

    try:
        # Resolve image_input to PIL Image
        if isinstance(image_input, bytes):
            image = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, str):
            image = Image.open(image_input)
        elif isinstance(image_input, Image.Image):
            image = image_input
        elif hasattr(image_input, "read"):
            image = Image.open(image_input)
        else:
            logger.error("Unsupported image input type for OCR: %s", type(image_input))
            return ""

        # Preprocessing with raw fallback
        try:
            processed = preprocess_image_for_ocr(image)
        except Exception as prep_err:
            logger.warning("OCR preprocessing error: %s; falling back to raw image", prep_err)
            processed = image

        text = pytesseract.image_to_string(processed, lang="eng")
        return text.strip()
    except Exception as exc:
        logger.error("OCR extraction failed from image: %s", exc)
        return ""


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    """
    Extracts text from scanned FIR image bytes (PNG, JPEG, TIFF, BMP).
    Wrapper around extract_text_from_image for backward compatibility.
    """
    return extract_text_from_image(image_bytes)


def extract_text_from_scanned_pdf(pdf_bytes: bytes) -> str:
    """
    Multi-Page PDF Text Extraction & OCR Engine.
    Iterates through each page in sequence:
    1. Extracts native embedded vector text if available.
    2. Renders high-res 200 DPI pixmap and runs OpenCV deskewing + Otsu binarization for scanned pages.
    3. Concatenates all pages into a unified narrative.
    """
    extracted_pages = []
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)
        logger.info("[PDF_OCR] Processing multi-page PDF (%d pages)...", total_pages)

        for page_num in range(total_pages):
            page = doc[page_num]
            page_text = page.get_text()

            # If page contains native digital text (> 40 chars), utilize directly
            if page_text and len(page_text.strip()) > 40:
                extracted_pages.append(f"--- PAGE {page_num + 1} ---\n{page_text.strip()}")
            else:
                # Scanned image page: render high-res pixmap (200 DPI) for OCR
                pix = page.get_pixmap(dpi=200)
                ocr_text = extract_text_from_image(pix.tobytes("png"))
                if ocr_text.strip():
                    extracted_pages.append(f"--- PAGE {page_num + 1} (OCR) ---\n{ocr_text.strip()}")
    except Exception as exc:
        logger.error("Failed parsing multi-page PDF: %s", exc)

    return "\n\n".join(extracted_pages).strip()
