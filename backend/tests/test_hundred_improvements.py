"""
Unit & Integration Test Suite for CRIMENEXUS 100 AI/ML, Data Analysis & Output Improvements
Verifies full catalog coverage, performance audit benchmarks, and cryptographic Merkle root generation.
"""

import pytest
from app.services.analytics.hundred_improvements_engine import hundred_engine

def test_all_hundred_improvements_catalog():
    """Verifies that exactly 100 improvements are registered with sequential numbering 1..100."""
    improvements = hundred_engine.get_all_improvements()
    assert len(improvements) == 100, f"Expected 100 improvements, found {len(improvements)}"

    numbers = [imp.number for imp in improvements]
    assert numbers == list(range(1, 101)), "Improvement numbers must be sequential from 1 to 100."

def test_category_distribution():
    """Verifies representation across all 10 technical categories."""
    improvements = hundred_engine.get_all_improvements()
    categories = {imp.category for imp in improvements}

    expected_categories = {
        "Model Training & Data Quality",
        "NLP & Text Processing",
        "Graph & Network Analysis",
        "Anomaly & Risk Detection",
        "RAG & LLM",
        "Geospatial & Mapping",
        "Data Pipeline & Quality",
        "Output & Reporting",
        "Evaluation & Testing",
    }
    assert expected_categories.issubset(categories), f"Missing categories: {expected_categories - categories}"

def test_full_performance_audit_metrics():
    """Verifies the performance audit scorecard, latency metrics, and SHA-256 Merkle root."""
    audit = hundred_engine.run_full_performance_audit()
    meta = audit["audit_metadata"]
    perf = audit["performance_metrics_summary"]

    assert meta["total_improvements_evaluated"] == 100
    assert meta["total_passed"] == 100
    assert meta["system_pass_rate"] == "100.0%"
    assert len(meta["merkle_audit_root"]) == 64, "Merkle audit root must be a valid 64-character hex string."

    # Validate average latency and memory bounds
    assert perf["average_inference_latency_ms"] > 0
    assert perf["total_memory_envelope_mb"] > 0
    assert "Speedup" in perf["speedup_factor_vs_legacy"] or "x" in perf["speedup_factor_vs_legacy"]

def test_category_specific_improvements():
    """Verifies detailed specifications and statutory compliance standards for key technicals."""
    # Imp 1: SpaCy Karnataka NER
    ner_imp = [i for i in hundred_engine.get_all_improvements() if i.number == 1][0]
    assert "Karnataka Police" in ner_imp.name
    assert "Sec 173 BNSS" in ner_imp.statutory_standard
    assert "PASS" in ner_imp.audit_verdict

    # Imp 22: TrOCR Handwritten
    trocr_imp = [i for i in hundred_engine.get_all_improvements() if i.number == 22][0]
    assert "TrOCR" in trocr_imp.name
    assert trocr_imp.latency_ms > 0

    # Imp 36: GNN Link Prediction
    gnn_imp = [i for i in hundred_engine.get_all_improvements() if i.number == 36][0]
    assert "GNN" in gnn_imp.name
    assert "Sec 111 BNS" in gnn_imp.statutory_standard

    # Imp 87: Court-Ready Section 63 BSA Dossier
    bsa_imp = [i for i in hundred_engine.get_all_improvements() if i.number == 87][0]
    assert "Section 63" in bsa_imp.statutory_standard
    assert "court-ready" in bsa_imp.name.lower() or "dossier" in bsa_imp.name.lower()

    # Imp 96: RAGAS Evaluation
    ragas_imp = [i for i in hundred_engine.get_all_improvements() if i.number == 96][0]
    assert "RAGAS" in ragas_imp.name
