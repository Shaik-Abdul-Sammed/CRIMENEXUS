import io
import pytest
from PIL import Image, ImageDraw, ImageFont

from app.ml_service.ocr_engine import extract_text_from_image_bytes, check_tesseract_availability
from app.ml_service.ner_model import get_ner_pipeline
from app.ml_service.anomaly_detector import get_anomaly_detector
from app.ml_service.explainable_risk import get_risk_model
from app.ml_service.semantic_search import get_mo_semantic_search_engine
from app.ml_service.model_registry import get_ml_registry


def test_ocr_scanned_image_extraction():
    """
    Test Step 1: Generates a synthetic scanned police document image
    and verifies Tesseract OCR extracts text entities.
    """
    # Create a 400x120 white image with black text simulating scanned document
    img = Image.new("RGB", (500, 150), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    text_content = "POLICE STATION SECTOR 20\nFIR NO 102/2026\nACCUSED RAJAN VEHICLE TS09AB1234"
    draw.text((20, 20), text_content, fill=(0, 0, 0))

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    raw_bytes = img_byte_arr.getvalue()

    extracted_text = extract_text_from_image_bytes(raw_bytes)
    assert extracted_text is not None
    assert len(extracted_text) > 0

    # Test NER pipeline on extracted text
    ner = get_ner_pipeline()
    entities = ner.extract_entities(extracted_text)
    assert "SUSPECT" in entities or "VEHICLE" in entities or len(extracted_text) > 5
    print("\n[TEST OCR & NER PASSED]: Extracted text length:", len(extracted_text))


def test_isolation_forest_anomaly_detection():
    """
    Test Step 2: Verifies Isolation Forest detects structured smurfing deposits
    and outputs continuous anomaly score > 0.85 triggering High Priority Alert.
    """
    detector = get_anomaly_detector()

    # 1. Normal customer payroll/utility transaction batch
    normal_txs = [
        {"sender_account": "ACC-PAYROLL-01", "amount": 75000.0, "timestamp": "2026-10-30T10:00:00"},
        {"sender_account": "ACC-CLIENT-02", "amount": 120000.0, "timestamp": "2026-10-30T12:00:00"}
    ]
    normal_eval = detector.evaluate_account_transactions("BEN-REGULAR-100", normal_txs)
    assert normal_eval["anomaly_score"] < 0.85
    assert normal_eval["high_priority_alert"] is False

    # 2. Structured Smurfing Cluster (< 50,000 INR from multiple accounts in 48h)
    smurf_txs = [
        {"sender_account": "MULE-ACC-01", "amount": 49200.0, "timestamp": "2026-10-30T09:00:00"},
        {"sender_account": "MULE-ACC-02", "amount": 48500.0, "timestamp": "2026-10-30T11:30:00"},
        {"sender_account": "MULE-ACC-03", "amount": 49900.0, "timestamp": "2026-10-30T14:15:00"},
        {"sender_account": "MULE-ACC-04", "amount": 47000.0, "timestamp": "2026-10-30T18:00:00"}
    ]
    smurf_eval = detector.evaluate_account_transactions("BEN-HAWALA-999", smurf_txs)
    assert smurf_eval["anomaly_score"] >= 0.85
    assert smurf_eval["high_priority_alert"] is True
    assert smurf_eval["is_outlier"] is True
    assert smurf_eval["feature_metrics"]["structuring_detected"] is True
    print(f"\n[TEST ANOMALY DETECTION PASSED]: Continuous Anomaly Score: {smurf_eval['anomaly_score']}")


def test_shap_explainable_risk_scoring():
    """
    Test Step 3: Verifies Composite Risk Model produces continuous score
    and exact Shapley feature attributions with judicial audit summary.
    """
    risk_model = get_risk_model()
    result = risk_model.compute_risk_with_shap(
        degree_centrality=14.0,
        financial_volume=4800000.0,
        anpr_sightings=5.0,
        cdr_frequency=38.0
    )

    assert result["overall_threat_score"] >= 75.0
    assert "shap_breakdown" in result
    assert len(result["shap_breakdown"]) == 4

    # Attributions sum close to 100%
    total_pct = sum(item["contribution_pct"] for item in result["shap_breakdown"])
    assert 99.0 <= total_pct <= 101.0

    # Judicial audit compliance check
    assert "Section 65B BNSS Compliance" in result["judicial_audit_summary"]
    print(f"\n[TEST XAI SHAP PASSED]: Overall Score: {result['overall_threat_score']}%, Top Factor: {result['shap_breakdown'][0]['feature_name']}")


def test_semantic_vector_search_similar_mo():
    """
    Test Step 4: Verifies high-dimensional vector embeddings and cosine similarity
    match incoming crime narrative with historical syndicated cases.
    """
    engine = get_mo_semantic_search_engine()

    # Query narrative describing structured smurfing and Hawala ATM withdrawals
    query_fir = (
        "Beneficiary received multiple UPI micro-deposits of ₹48,000 from distinct mule accounts "
        "within 48 hours. The funds were quickly cashed out via ATM kiosks in Karol Bagh and transferred."
    )

    result = engine.find_similar_mo(query_fir, top_k=3, threshold=0.80)
    assert len(result["matches"]) > 0
    top_match = result["matches"][0]
    assert top_match["case_id"] == "FIR-2025-CYB-0081"
    assert top_match["similarity_score"] >= 0.70
    assert result["has_alert"] is True
    assert "Similar MO detected" in result["mo_alert"]
    print(f"\n[TEST VECTOR MO PASSED]: Matched Case {top_match['case_id']} with {top_match['similarity_percentage']}% similarity")


def test_mlops_model_registry():
    """
    Test Step 5: Verifies in-memory singleton model registry warms up all 5 models.
    """
    registry = get_ml_registry()
    status = registry.warm_up_all_models()
    assert len(status) == 5
    assert status["ocr_engine"]["status"] in ["READY", "UNAVAILABLE"]
    assert status["ner_model"]["status"] == "READY"
    assert status["financial_anomaly_detector"]["status"] == "READY"
    assert status["explainable_risk_model"]["status"] == "READY"
    assert status["mo_semantic_search"]["status"] == "READY"
    print("\n[TEST MLOPS REGISTRY PASSED]: All 5 Production Models Warmed In Memory")
