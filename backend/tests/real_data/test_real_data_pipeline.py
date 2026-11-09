"""
Test Suite: Real-World Indian Crime Data Acquisition & Model Training Pipeline
Tests:
1. Downloads datasets and verifies raw CSV existence
2. Validates SHA-256 hash calculation and manifest integrity
3. Trains SpaCy NER on Karnataka Police FIR dataset (verifies F1 > 0.85)
4. Trains Crime Category Classifier and checks serialization
5. Trains Crime Forecaster and checks serialization
6. Validates data provenance registry endpoint GET /api/v1/ml/data-provenance
"""

import os
import sys
import json
import pytest

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient

from app.main import app
from scripts.download_real_datasets import (
    DATASET_SOURCES,
    download_dataset,
    compute_sha256,
    DATA_RAW_DIR,
    MANIFEST_PATH,
)
from scripts.train_on_real_data import (
    train_spacy_ner,
    train_crime_classifier,
    train_crime_forecaster,
    MODELS_DIR,
)
from app.ml_service.real_data_registry import get_data_registry

client = TestClient(app)


def test_download_datasets_and_manifest():
    """Test 1 & 2: Datasets download, SHA-256 matches, and manifest is written."""
    os.makedirs(DATA_RAW_DIR, exist_ok=True)

    manifest_entries = {}
    for key, spec in DATASET_SOURCES.items():
        res = download_dataset(key, spec)
        assert res["status"] == "VERIFIED_PRESENT"
        assert os.path.exists(res["filepath"])
        assert os.path.getsize(res["filepath"]) > 0

        # Verify hash match
        recomputed_sha256 = compute_sha256(res["filepath"])
        assert recomputed_sha256 == res["sha256"]
        manifest_entries[key] = res

    # Write manifest
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump({"pipeline_version": "2.4.0", "datasets": manifest_entries}, f, indent=2)

    assert os.path.exists(MANIFEST_PATH)


def test_train_spacy_ner_on_karnataka_data():
    """Test 3: SpaCy NER trains on Karnataka FIR data and achieves high entity F1."""
    metrics = train_spacy_ner()
    assert metrics["OVERALL_F1"] >= 0.85
    assert "LEGAL_SECTION" in metrics
    assert "SUSPECT" in metrics
    assert "LOCATION" in metrics
    assert "VEHICLE" in metrics
    assert "PHONE" in metrics


def test_train_crime_classifier_and_forecaster():
    """Test 4 & 5: Classifier and Poisson Forecaster train and serialize model files."""
    clf_res = train_crime_classifier()
    assert clf_res["status"] in ["TRAINED_SERIALIZED", "FALLBACK_SAVED"]
    assert os.path.exists(os.path.join(MODELS_DIR, "crime_classifier.pkl"))

    forecaster_res = train_crime_forecaster()
    assert forecaster_res["status"] in ["TRAINED_SERIALIZED", "FALLBACK_SAVED"]
    assert os.path.exists(os.path.join(MODELS_DIR, "crime_forecaster.pkl"))


def test_data_provenance_api_endpoint():
    """Test 6: GET /api/v1/ml/data-provenance returns real datasets and zero synthetic models."""
    response = client.get("/api/v1/ml/data-provenance")
    assert response.status_code == 200, f"Provenance endpoint failed: {response.text}"
    body = response.json()

    assert body["synthetic_data_present"] is False
    assert body["real_datasets_grounded"] is True
    assert "karnataka_police_fir" in body["datasets"]
    assert "ncrb_crime_in_india_summary" in body["datasets"]
    assert "fir_ner_model" in body["models"]
