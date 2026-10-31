import io
import pytest
from PIL import Image, ImageDraw, ImageFont
from fastapi.testclient import TestClient
from app.main import app
from app.ml_service.video_processor import VideoANPRProcessor, get_video_processor, ANPR_STREAM_NAME


def create_synthetic_anpr_plate_image(plate_text: str = "TS 09 AB 1234") -> bytes:
    """Generates an in-memory high-contrast license plate image for testing OCR ANPR."""
    img = Image.new("RGB", (600, 200), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Draw dark border simulating an Indian HSRP number plate
    draw.rectangle([5, 5, 595, 195], outline=(0, 0, 0), width=4)
    # Draw plate text
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
    except Exception:
        font = ImageFont.load_default()
    draw.text((60, 70), plate_text, fill=(0, 0, 0), font=font)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_video_anpr_plate_detection():
    processor = VideoANPRProcessor()
    plate_img_bytes = create_synthetic_anpr_plate_image("TS 09 AB 1234")
    image = Image.open(io.BytesIO(plate_img_bytes))

    # Test plate detection
    detected = processor.detect_plates_from_image(image)
    assert len(detected) >= 1
    assert any("TS 09 AB 1234" in d["plate_number"] or "TS" in d["plate_number"] for d in detected)
    assert detected[0]["confidence"] >= 0.85


def test_video_anpr_redis_stream_publish():
    processor = VideoANPRProcessor()
    sighting = {
        "plate_number": "TS 09 AB 1234",
        "camera_id": "CAM-TEST-TOLL-01",
        "location_name": "Yamuna Expressway Toll KM 48",
        "latitude": 28.1402,
        "longitude": 77.5510,
        "confidence": 0.98,
        "frame_index": 0,
    }

    entry_id = processor.publish_sighting(sighting)
    # If redis server is running locally, entry_id will be valid redis stream ID string
    if entry_id is not None:
        assert "-" in entry_id
        # Verify read from stream
        client = processor.get_redis_client()
        if client:
            records = client.xrevrange(ANPR_STREAM_NAME, count=1)
            assert len(records) > 0
            stream_id, stream_data = records[0]
            assert stream_data["plate_number"] == "TS 09 AB 1234"
            assert stream_data["camera_id"] == "CAM-TEST-TOLL-01"


def test_video_anpr_api_endpoint():
    client = TestClient(app)
    plate_img_bytes = create_synthetic_anpr_plate_image("TS 09 AB 1234")

    response = client.post(
        "/api/v1/forensics/video/anpr-feed",
        files={"file": ("toll_cam_frame.png", plate_img_bytes, "image/png")},
        data={
            "camera_id": "CAM-YAMUNA-EXPR-04",
            "location_name": "Yamuna Expressway Toll KM 48",
            "latitude": "28.1402",
            "longitude": "77.5510",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert data["processed_frames_count"] >= 1
    assert len(data["sightings"]) >= 1
    assert any("TS" in p for p in data["unique_plates"])
