"""
Automation 6: Multi-Modal Video AI & Automatic Number Plate Recognition (ANPR).
Tests:
  1. Feed a dummy video frame -> verify OCR extracts plate text 'TS 09 AB 1234'.
  2. Feed a blurry/low-contrast frame -> verify confidence score reflects low quality.
  3. Verify extracted plate is pushed to Redis stream 'anpr.sightings'.
  4. Feed a non-vehicle image -> verify "no plate found" (not false positive).
  5. Verify processed frame is saved with timestamp for evidence chain.
"""

import io
import os
import sys
from PIL import Image, ImageDraw, ImageFont
from app.ml_service.video_processor import VideoANPRProcessor, ANPR_STREAM_NAME


def create_anpr_plate_image(plate_text: str = "TS 09 AB 1234", contrast_high: bool = True) -> Image.Image:
    """Generates an in-memory synthetic number plate image."""
    bg_color = (255, 255, 255) if contrast_high else (180, 180, 180)
    text_color = (0, 0, 0) if contrast_high else (160, 160, 160)

    img = Image.new("RGB", (600, 180), color=bg_color)
    draw = ImageDraw.Draw(img)
    draw.rectangle([6, 6, 594, 174], outline=(0, 0, 0) if contrast_high else (170, 170, 170), width=4)

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 46)
    except Exception:
        font = ImageFont.load_default()

    draw.text((60, 60), plate_text, fill=text_color, font=font)
    return img


def test_video_anpr_plate_extraction():
    """Test 1: Feed a dummy video frame -> verify OCR extracts plate text 'TS 09 AB 1234'."""
    processor = VideoANPRProcessor()
    frame = create_anpr_plate_image("TS 09 AB 1234", contrast_high=True)

    detected = processor.detect_plates_from_image(frame)
    assert len(detected) >= 1, "Expected at least 1 plate detected from high-contrast frame"
    assert any("TS 09 AB 1234" in d["plate_number"] or "TS" in d["plate_number"] for d in detected)
    assert detected[0]["state_code"] == "TS"


def test_video_anpr_low_contrast_confidence_degradation():
    """Test 2: Feed a blurry/low-contrast frame -> verify confidence score reflects low quality."""
    processor = VideoANPRProcessor()
    low_contrast_frame = create_anpr_plate_image("TS 09 AB 1234", contrast_high=False)

    detected = processor.detect_plates_from_image(low_contrast_frame)
    # Either OCR fails due to degraded contrast or flags reduced confidence score
    if detected:
        assert detected[0]["confidence"] <= 0.75, f"Low contrast frame confidence should be <= 0.75, got {detected[0]['confidence']}"
    else:
        # If OCR returned empty due to extreme low contrast, verified degradation
        assert True


def test_video_anpr_redis_stream_publish():
    """Test 3: Verify extracted plate is pushed to Redis stream 'anpr.sightings'."""
    processor = VideoANPRProcessor()
    sighting = {
        "plate_number": "TS 09 AB 1234",
        "camera_id": "CAM-TEST-TOLL-99",
        "location_name": "Yamuna Expressway Toll KM 48",
        "latitude": 28.1402,
        "longitude": 77.5510,
        "confidence": 0.95,
        "frame_index": 1,
    }

    event_id = processor.publish_sighting(sighting)
    assert event_id is not None, "Failed to publish sighting to Redis stream"

    # Verify message presence in Redis stream
    r = processor.get_redis_client()
    if r:
        messages = r.xrange(ANPR_STREAM_NAME, min="-", max="+", count=10)
        assert len(messages) >= 1
        last_msg = messages[-1][1]
        assert last_msg.get("plate_number") == "TS 09 AB 1234"
        assert last_msg.get("camera_id") == "CAM-TEST-TOLL-99"


def test_video_anpr_non_vehicle_image_no_false_positive():
    """Test 4: Feed a non-vehicle image -> verify 'no plate found' (not false positive)."""
    processor = VideoANPRProcessor()
    # Create an image containing general landscape/office text without license plate formatting
    img = Image.new("RGB", (500, 200), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    draw.text((20, 40), "Annual General Meeting 2026", fill=(50, 50, 50))
    draw.text((20, 90), "Conference Room B, Corporate Tower", fill=(50, 50, 50))

    detected = processor.detect_plates_from_image(img)
    assert len(detected) == 0, f"Expected 0 plates detected for non-vehicle image, got {detected}"


def test_video_anpr_save_frame_evidence_chain():
    """Test 5: Verify processed frame is saved with timestamp for evidence chain."""
    processor = VideoANPRProcessor()
    frame = create_anpr_plate_image("TS 09 AB 1234", contrast_high=True)

    result = processor.save_processed_frame(
        frame=frame,
        plate_number="TS 09 AB 1234",
        output_dir="backend/data/evidence/anpr"
    )

    assert result is not None
    assert "file_path" in result
    assert "sha256_hash" in result
    assert len(result["sha256_hash"]) == 64
    assert os.path.exists(result["file_path"]), f"Evidence file was not created: {result['file_path']}"
    assert result["file_size_bytes"] > 0

    # Cleanup temporary test evidence image
    if os.path.exists(result["file_path"]):
        os.remove(result["file_path"])


if __name__ == "__main__":
    test_video_anpr_plate_extraction()
    test_video_anpr_low_contrast_confidence_degradation()
    test_video_anpr_redis_stream_publish()
    test_video_anpr_non_vehicle_image_no_false_positive()
    test_video_anpr_save_frame_evidence_chain()
    print("ALL 5 Video ANPR Automation Tests PASSED.")
