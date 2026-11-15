"""
Real IBIS Ballistics Machine Learning Verification Test.
Tests ResNet18 deep visual embedding cross-correlation with perceptual hash fallback.
"""

import io
import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient


def create_synthetic_cartridge(seed: int = 42) -> bytes:
    """Generates a synthetic microscopic cartridge breech face / firing pin image."""
    img = Image.new("RGB", (128, 128), color=(180, 160, 120))
    draw = ImageDraw.Draw(img)
    # Draw firing pin aperture and concentric circular striations
    draw.ellipse((44, 44, 84, 84), fill=(100, 90, 70), outline=(50, 45, 35))
    draw.ellipse((30, 30, 98, 98), outline=(130, 115, 85))
    draw.line((20, 64, 108, 64), fill=(70, 60, 50), width=1)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_ibis_resnet_embedding(client: TestClient, auth_headers):
    """
    Test that IBIS ballistics matching runs deep visual ResNet18 feature extraction
    or fallback perceptual hashing on cartridge images.
    """
    img1 = create_synthetic_cartridge(seed=42)

    response = client.post(
        "/api/v1/ibis/match",
        files={"query_image": ("cartridge_specimen.png", io.BytesIO(img1), "image/png")},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["model_engine"] in ["resnet18", "fallback_hash"]
    assert "matches" in data
    assert len(data["matches"]) >= 1
    assert "similarity" in data["matches"][0]
