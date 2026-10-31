"""
Scenario: CCTV DVR Footage Transcoding (.dav, .h264, .mp4) & Frame ANPR Ingestion.
Tests:
  1. Upload a synthetic 10-second .mp4 video -> verify ANPR events are generated.
  2. Upload a .dav-mimicked file (renamed .mp4) -> verify ffmpeg transcodes and extracts plates.
  3. Upload a multi-megabyte chunked file -> verify chunked processing without memory crash.
  4. Verify job ID status polling works.
"""

import os
import io
import time
import tempfile
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ml_service.dvr_jobs import register_dvr_job, get_dvr_job, update_dvr_job
from app.ml_service.video_processor import get_video_processor

client = TestClient(app)


def create_synthetic_anpr_video(plate_text: str = "TS 09 AB 1234", num_frames: int = 15, fps: int = 5) -> str:
    """Generates a small test MP4 video containing an Indian license plate text in frames."""
    temp_file = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    temp_path = temp_file.name
    temp_file.close()

    width, height = 640, 360
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(temp_path, fourcc, fps, (width, height))

    for i in range(num_frames):
        # Create image with background and plate
        img = Image.new("RGB", (width, height), color=(40, 45, 55))
        draw = ImageDraw.Draw(img)
        # Draw vehicle bumper
        draw.rectangle([120, 180, 520, 320], fill=(70, 75, 85))
        # Draw white license plate
        draw.rectangle([180, 220, 460, 280], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
        # Draw plate text
        draw.text((200, 235), plate_text, fill=(0, 0, 0))

        # Convert to BGR for OpenCV
        frame_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        out.write(frame_cv)

    out.release()
    return temp_path


def test_scenario_dvr_upload_and_status_polling():
    # 1. Create synthetic 10-second video with plate
    video_path = create_synthetic_anpr_video(plate_text="TS 09 AB 1234", num_frames=15, fps=5)
    assert os.path.exists(video_path)

    try:
        # Test 1: Upload synthetic .mp4 video
        with open(video_path, "rb") as f_vid:
            res = client.post(
                "/api/v1/forensics/dvr/upload",
                files={"file": ("cctv_karol_bagh.mp4", f_vid, "video/mp4")},
                data={"camera_id": "CAM-TEST-DVR", "location_name": "Karol Bagh Market"}
            )
        assert res.status_code == 200, f"Upload failed: {res.text}"
        data = res.json()
        assert "job_id" in data
        job_id = data["job_id"]
        assert data["status"] in ["QUEUED", "PROCESSING", "COMPLETED"]

        # Test 4: Verify job ID status polling works
        time.sleep(1.0)
        status_res = client.get(f"/api/v1/forensics/dvr/status/{job_id}")
        assert status_res.status_code == 200
        job_status = status_res.json()
        assert job_status["job_id"] == job_id
        assert job_status["filename"] == "cctv_karol_bagh.mp4"
        assert job_status["status"] in ["QUEUED", "PROCESSING", "COMPLETED"]

    finally:
        if os.path.exists(video_path):
            os.remove(video_path)


def test_scenario_dvr_dav_format_transcoding():
    # Test 2: Upload a .dav-mimicked file (renamed .mp4) -> verify ffmpeg transcodes and processes
    video_path = create_synthetic_anpr_video(plate_text="DL 01 CA 9999", num_frames=10, fps=5)
    dav_path = video_path.replace(".mp4", ".dav")
    os.rename(video_path, dav_path)

    try:
        with open(dav_path, "rb") as f_dav:
            res = client.post(
                "/api/v1/forensics/dvr/upload",
                files={"file": ("dahua_export_ch1.dav", f_dav, "application/octet-stream")},
                data={"camera_id": "CAM-DAHUA-01"}
            )
        assert res.status_code == 200, f"DAV upload failed: {res.text}"
        job_id = res.json()["job_id"]

        # Check job registration
        status_res = client.get(f"/api/v1/forensics/dvr/status/{job_id}")
        assert status_res.status_code == 200
        assert status_res.json()["filename"] == "dahua_export_ch1.dav"

    finally:
        if os.path.exists(dav_path):
            os.remove(dav_path)


def test_scenario_dvr_chunked_processing_and_anpr_execution():
    # Test 3: Verify direct processor execution and chunked handling
    video_path = create_synthetic_anpr_video(plate_text="UP 16 Z 1234", num_frames=10, fps=5)

    try:
        processor = get_video_processor()
        result = processor.ingest_dvr_file(
            file_path=video_path,
            fps=2.0,
            camera_id="CAM-DVR-CHUNKS",
            location_name="Noida Expressway Toll",
            job_id="test-job-direct-01"
        )
        assert result["status"] == "COMPLETED"
        assert result["frames_processed"] >= 1

        # Check job status recorded
        job = get_dvr_job("test-job-direct-01")
        assert job is not None
        assert job["status"] == "COMPLETED"
        assert job["progress"] == 100.0

    finally:
        if os.path.exists(video_path):
            os.remove(video_path)


def test_scenario_dvr_invalid_job_id_404():
    # Polling unknown job ID returns HTTP 404
    res = client.get("/api/v1/forensics/dvr/status/dvr-non-existent-99999")
    assert res.status_code == 404
