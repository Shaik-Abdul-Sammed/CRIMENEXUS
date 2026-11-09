import pytest
from app.services.forensics.multilingual_archive import MultilingualArchivePipeline

def test_hindi_fir_ocr_extraction():
    pipeline = MultilingualArchivePipeline()
    sample_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x10\x00\x00\x00\x10\x08\x06\x00\x00\x00\x1f\xf3\xffa"
    
    res = pipeline.extract_text_from_image(sample_bytes, is_handwritten=True, quality_score=0.88)
    assert res["success"] is True
    assert res["confidence"] >= 0.70
    assert len(res["text"]) > 10
    assert res["requires_manual_review"] is False

def test_bengali_language_detection():
    pipeline = MultilingualArchivePipeline()
    bengali_text = "জাল নথি ও ভুয়ো কোম্পানির মাধ্যমে রাষ্ট্রায়ত্ত ব্যাঙ্ক থেকে কোটি টাকার ঋণ তছরুপের অভিযোগ।"
    
    det = pipeline.detect_language(bengali_text)
    assert det["language"] == "bn"
    assert det["script"] == "Bengali"
    assert det["confidence"] >= 0.90

def test_blurry_image_ocr_rejection():
    pipeline = MultilingualArchivePipeline()
    sample_bytes = b"degraded_blurry_image_data_stream"
    
    # Degraded image with quality score below 0.60
    res = pipeline.extract_text_from_image(sample_bytes, is_handwritten=False, quality_score=0.45)
    assert res["success"] is False
    assert res["confidence"] < 0.60
    assert res["requires_manual_review"] is True
    assert "statutory threshold" in res["error"]
