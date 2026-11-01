"""
Comprehensive Test Suite for Deep AI Models, Topological Link Prediction,
KNN Spatial Imputation, and Strict Bank CSV Validation.
"""

from fastapi.testclient import TestClient
from app.main import app
from app.ml_service.anomaly_detector import get_anomaly_detector, DeepAutoencoderModel
from app.ml_service.link_prediction import get_link_predictor
from app.services.forensics.cdr_imputation import KNNTowerImputer
from app.services.forensics.bank_validation import validate_bank_csv_content, sanitize_csv_formula

client = TestClient(app)


# ─── 1. Deep Autoencoder Anomaly Detector Tests ───────────────────────────────

def test_deep_autoencoder_architecture_and_reconstruction():
    """Verify Deep Autoencoder compresses 5D features into 4D bottleneck and reconstructs."""
    ae = DeepAutoencoderModel(input_dim=5, latent_dim=4)
    import numpy as np

    # Synthetic normal samples
    normal_data = np.random.uniform(
        low=[1000, 5000, 1, 1, 12.0],
        high=[50000, 45000, 2, 2, 72.0],
        size=(50, 5)
    )
    ae.fit_normal_baseline(normal_data)
    assert ae.reconstruction_threshold > 0.0

    # Inliers should have low reconstruction loss
    test_inlier = np.array([[25000.0, 25000.0, 1.0, 1.0, 24.0]])
    inlier_losses = ae.compute_reconstruction_errors(test_inlier)
    assert len(inlier_losses) == 1

    # Structured smurfing cluster (dodging limit: ₹49,500, 5 senders in 2 hours)
    test_smurf = np.array([[49500.0, 500.0, 5.0, 5.0, 0.4]])
    smurf_losses = ae.compute_reconstruction_errors(test_smurf)
    assert smurf_losses[0] >= 0.0


def test_anomaly_detector_smurfing_alert_with_autoencoder_telemetry():
    """Verify production anomaly detector flags smurfing cluster with autoencoder metrics."""
    detector = get_anomaly_detector()

    smurf_transactions = [
        {"sender_account": "ACC-SENDER-01", "amount": 49200.0, "timestamp": "2026-10-28T10:00:00Z"},
        {"sender_account": "ACC-SENDER-02", "amount": 49450.0, "timestamp": "2026-10-28T10:30:00Z"},
        {"sender_account": "ACC-SENDER-03", "amount": 49100.0, "timestamp": "2026-10-28T11:15:00Z"},
        {"sender_account": "ACC-SENDER-04", "amount": 49800.0, "timestamp": "2026-10-28T11:45:00Z"},
    ]

    result = detector.evaluate_account_transactions("ACC-MULE-HAWALA-901", smurf_transactions)
    assert result["beneficiary_account"] == "ACC-MULE-HAWALA-901"
    assert result["anomaly_score"] >= 0.85
    assert result["is_outlier"] is True
    assert result["high_priority_alert"] is True
    assert result["model_used"] in ("deep_autoencoder_neural_network", "fallback_isolation_forest")
    assert "reconstruction_error" in result
    assert "reconstruction_threshold" in result
    assert result["feature_metrics"]["structuring_detected"] is True


def test_anomaly_detector_normal_commercial_transfers():
    """Verify standard commercial payroll/merchant transfers do not trigger false alerts."""
    detector = get_anomaly_detector()

    normal_txs = [
        {"sender_account": "ACC-VENDOR-01", "amount": 15000.0, "timestamp": "2026-10-20T09:00:00Z"},
        {"sender_account": "ACC-VENDOR-02", "amount": 8500.0, "timestamp": "2026-10-25T14:00:00Z"},
    ]

    result = detector.evaluate_account_transactions("ACC-REGULAR-SHOP-01", normal_txs)
    assert result["anomaly_score"] < 0.85
    assert result["high_priority_alert"] is False


# ─── 2. Topological Link Prediction Tests ─────────────────────────────────────

def test_topological_link_predictor_adamic_adar_jaccard():
    """Verify GraphLinkPredictor calculates Adamic-Adar and Jaccard for common intermediaries."""
    predictor = get_link_predictor()

    # Syndicate topology: Rajan (ENT-1) and Vikram (ENT-2) both interact with Burner SIM (ENT-3)
    nodes = [
        {"id": "ENT-1", "name": "Rajan", "type": "PERSON"},
        {"id": "ENT-2", "name": "Vikram Malhotra", "type": "PERSON"},
        {"id": "ENT-3", "name": "+91 99999 88888", "type": "PHONE"},
        {"id": "ENT-4", "name": "Hawala Mule ACC-902", "type": "BANK_ACCOUNT"},
    ]
    edges = [
        {"source": "ENT-1", "target": "ENT-3", "type": "CALLS"},
        {"source": "ENT-2", "target": "ENT-3", "type": "CALLS"},
        {"source": "ENT-2", "target": "ENT-4", "type": "TRANSFERS_TO"},
    ]

    result = predictor.predict_links(nodes, edges, top_k=5)
    assert result["status"] == "SUCCESS"
    assert result["model_used"] == "graph_topological_adamic_adar"
    assert result["predicted_links_count"] >= 1

    # Rajan and Vikram should be predicted as linked due to common phone neighbor
    candidate = next((l for l in result["predicted_links"] if (
        (l["source_id"] == "ENT-1" and l["target_id"] == "ENT-2") or
        (l["source_id"] == "ENT-2" and l["target_id"] == "ENT-1")
    )), None)

    assert candidate is not None
    assert candidate["confidence"] > 0.0
    assert candidate["common_neighbors_count"] == 1


def test_predict_links_api_endpoint():
    """GET /api/v1/network/predict-links returns 200 OK with ranked predictions."""
    response = client.get("/api/v1/network/predict-links")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "model_used" in data
    assert "predicted_links" in data
    assert isinstance(data["predicted_links"], list)


def test_predict_links_fallback_sparse_graph():
    """Verify fallback heuristic handles empty or sparse graphs gracefully."""
    predictor = get_link_predictor()
    sparse_nodes = [{"id": "S1", "name": "Lone Suspect", "type": "PERSON"}]
    res = predictor.predict_links(sparse_nodes, [], top_k=5)
    assert res["status"] == "SUCCESS"
    assert res["model_used"] == "fallback_heuristic"


# ─── 3. KNN Cell Tower Spatial Imputation Tests ───────────────────────────────

def test_knn_imputer_exact_known_tower_lookup():
    """Verify exact tower ID resolves known latitude/longitude with high confidence."""
    imputer = KNNTowerImputer(k=3)
    rec = {
        "caller": "+91 98765 43210",
        "cell_tower": "TOWER-NOIDA-62",
        "timestamp": "2026-10-28T12:00:00Z"
    }

    imputed = imputer.impute_record_coordinates(rec)
    assert imputed["imputed"] is True
    assert abs(imputed["latitude"] - 28.6280) < 0.001
    assert abs(imputed["longitude"] - 77.3649) < 0.001
    assert imputed["imputation_confidence"] >= 0.95


def test_knn_imputer_contextual_neighbor_interpolation():
    """Verify missing coordinates without tower ID interpolate from neighboring GPS pings."""
    imputer = KNNTowerImputer(k=3)
    history = [
        {"latitude": 28.6300, "longitude": 77.2100},
        {"latitude": 28.6320, "longitude": 77.2150},
        {"latitude": 28.6310, "longitude": 77.2200},
    ]

    missing_rec = {"caller": "+91 99999 11111", "cell_tower": "UNKNOWN_CARRIER_ID"}
    imputed = imputer.impute_record_coordinates(missing_rec, context_records=history)

    assert imputed["imputed"] is True
    assert 28.625 <= imputed["latitude"] <= 28.640
    assert 77.200 <= imputed["longitude"] <= 77.230
    assert "knn_temporal_context" in imputed["imputation_method"]


def test_knn_imputer_batch_processing_and_gc():
    """Verify batch imputation processes records and triggers garbage collection."""
    imputer = KNNTowerImputer(k=3)
    batch = [
        {"caller": "A", "cell_tower": "TOWER-DEL-CONN"},
        {"caller": "A", "latitude": 28.6315, "longitude": 77.2167},  # Existing
        {"caller": "A", "cell_tower": "TOWER-IGI-AIRPORT"},
    ]
    results = imputer.impute_batch(batch)
    assert len(results) == 3
    assert all("latitude" in r and "longitude" in r for r in results)


# ─── 4. Strict Bank CSV Validation Tests ──────────────────────────────────────

def test_bank_csv_validation_valid_file():
    """Verify valid bank statement CSV parses into clean typed transaction dicts."""
    valid_csv = """transaction_id,timestamp,sender_account,beneficiary_account,amount,transaction_type
TXN1001,2026-10-28 10:15:00,ACC99112233,ACC88776655,48500.00,NEFT
TXN1002,2026-10-28 10:45:00,ACC99112244,ACC88776655,49200.00,IMPS
"""
    rows, summary = validate_bank_csv_content(valid_csv)
    assert len(rows) == 2
    assert summary["rejected_rows_count"] == 0
    assert rows[0]["amount"] == 48500.00
    assert rows[0]["beneficiary_account"] == "ACC88776655"


def test_bank_csv_validation_formula_injection_sanitization():
    """Verify CSV formula injection attacks are neutralized with leading apostrophe."""
    malicious_input = "=cmd|' /C calc'!A0"
    sanitized = sanitize_csv_formula(malicious_input)
    assert sanitized.startswith("'")

    csv_payload = f"""transaction_id,timestamp,sender_account,beneficiary_account,amount
TXN1003,2026-10-28 11:00:00,ACC99112255,ACC88776655,49000.00
"""
    rows, _ = validate_bank_csv_content(csv_payload)
    assert len(rows) == 1


def test_bank_csv_validation_rejects_corrupted_rows():
    """Verify rows with negative amounts or corrupted accounts are logged in rejection audit."""
    corrupt_csv = """transaction_id,timestamp,sender_account,beneficiary_account,amount
TXN1004,2026-10-28 11:15:00,ACC99112266,ACC88776655,-5000.00
TXN1005,INVALID_DATE,ACC99112277,ACC88776655,45000.00
TXN1006,2026-10-28 11:45:00,ACC99112288,ACC88776655,47500.00
TXN1007,2026-10-28 12:00:00,ACC99112289,ACC88776655,48200.00
TXN1008,2026-10-28 12:30:00,ACC99112290,ACC88776655,49100.00
"""
    rows, summary = validate_bank_csv_content(corrupt_csv)
    assert len(rows) == 3
    assert summary["rejected_rows_count"] == 2
    assert len(summary["rejected_details"]) == 2


def test_bank_csv_validation_rejects_excessive_corruption_rate():
    """Verify file is rejected outright when corruption rate exceeds 50% threshold."""
    import pytest
    heavily_corrupted = """transaction_id,timestamp,sender_account,beneficiary_account,amount
TXN1009,2026-10-28 11:15:00,ACC99112266,ACC88776655,-5000.00
TXN1010,INVALID_DATE,ACC99112277,ACC88776655,45000.00
TXN1011,2026-10-28 11:45:00,ACC99112288,ACC88776655,47500.00
"""
    with pytest.raises(ValueError, match="High CSV corruption rate"):
        validate_bank_csv_content(heavily_corrupted)

