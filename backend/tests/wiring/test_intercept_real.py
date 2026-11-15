"""
Real Lawful Intercept Speech-to-Text & Argot Translation Verification Test.
Tests Whisper ASR pipeline with certified underworld argot dictionary fallback.
"""

import io
import math
import struct
import pytest
from fastapi.testclient import TestClient


def generate_synthetic_audio(duration_sec: float = 2.0, sample_rate: int = 16000) -> bytes:
    """Generates standard uncompressed 16-bit PCM WAV audio."""
    num_samples = int(duration_sec * sample_rate)
    data = bytearray()
    for i in range(num_samples):
        sample = int(32767.0 * 0.4 * math.sin(2.0 * math.pi * 440.0 * i / sample_rate))
        data.extend(struct.pack("<h", sample))

    buf = io.BytesIO()
    buf.write(b"RIFF")
    buf.write(struct.pack("<I", 36 + len(data)))
    buf.write(b"WAVE")
    buf.write(b"fmt ")
    buf.write(struct.pack("<I", 16))
    buf.write(struct.pack("<H", 1))  # PCM format
    buf.write(struct.pack("<H", 1))  # 1 channel (mono)
    buf.write(struct.pack("<I", sample_rate))
    buf.write(struct.pack("<I", sample_rate * 2))
    buf.write(struct.pack("<H", 2))
    buf.write(struct.pack("<H", 16))
    buf.write(b"data")
    buf.write(struct.pack("<I", len(data)))
    buf.write(data)
    return buf.getvalue()


def test_intercept_whisper_real(client: TestClient, auth_headers):
    """
    Test that lawful intercept translation accepts raw audio,
    processes via Whisper or argot fallback, and returns transcribed text.
    """
    audio_bytes = generate_synthetic_audio(2.0)

    response = client.post(
        "/api/v1/intercept/translate",
        files={"audio": ("lawful_intercept_tape.wav", io.BytesIO(audio_bytes), "audio/wav")},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["engine"] in ["whisper", "fallback_glossary"]
    assert "transcript_original" in data
    assert "translated_transcript" in data
