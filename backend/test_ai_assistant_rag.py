import pytest
from app.ml_service.rag_engine import get_rag_engine, MIN_RELEVANCE_SCORE


def test_anti_hallucination_irrelevant_query_aborted():
    """
    CRITICAL USER SCENARIO:
    Query: 'Ramu stolen the 10 crore necklace from RGUKT RKV'
    The system MUST NOT hallucinate links to CASE-2026-8812, Rajan, or assign 93% confidence.
    Must return: status: 'insufficient_data', confidence: 0.0, linked_entities: [].
    """
    engine = get_rag_engine()
    query = "Ramu stolen the 10 crore necklace from RGUKT RKV"

    result = engine.query_intelligence(query)

    assert result["status"] == "insufficient_data", f"Expected 'insufficient_data', got {result['status']}"
    assert result["confidence"] == 0.0, f"Expected 0.0 confidence, got {result['confidence']}"
    assert result["linked_entities"] == [], f"Expected empty linked_entities, got {result['linked_entities']}"
    assert "Insufficient evidence found in the database" in result["message"]
    print("\n[ANTI-HALLUCINATION TEST PASSED]: Irrelevant query successfully rejected with 0.0 confidence.")


def test_hybrid_search_and_grounded_query_success():
    """
    Legitimate investigation query regarding verified evidence in the database.
    Query: 'Explain connection between Rajan and HDFC account 908122'
    Must return: status: 'success', dynamic confidence > 0.65, verified linked entities and chunks.
    """
    engine = get_rag_engine()
    query = "Explain connection between Rajan and HDFC account 908122"

    result = engine.query_intelligence(query)

    assert result["status"] == "success", f"Expected 'success', got {result['status']}"
    assert result["confidence"] >= MIN_RELEVANCE_SCORE, f"Confidence {result['confidence']} should meet threshold {MIN_RELEVANCE_SCORE}"
    assert result["confidence"] != 0.93, "Confidence should be dynamically calculated, NOT hardcoded 0.93"
    assert len(result["retrieved_chunks"]) <= 3, f"Strict top-K must be <= 3 chunks, got {len(result['retrieved_chunks'])}"
    assert any("HDFC" in c["text"] or "Rajan" in c["text"] for c in result["retrieved_chunks"])
    print(f"\n[GROUNDED RAG TEST PASSED]: Verified query succeeded with dynamic confidence: {result['confidence']:.3f}")


def test_dynamic_confidence_formula():
    """
    Verify that dynamic confidence strictly obeys:
    Confidence = (Top_ReRank_Score * 0.7) + (Entity_Overlap_Ratio * 0.3)
    """
    engine = get_rag_engine()
    fake_chunk = {
        "text": "Rajan operated vehicle TS 09 AB 1234 along Yamuna expressway.",
        "metadata": {"entities": ["Rajan", "TS 09 AB 1234"]}
    }
    # Query with matching entity
    conf_match, overlap_match = engine.calculate_dynamic_confidence("Rajan at Yamuna", fake_chunk, 0.85)
    expected_match = round((0.85 * 0.7) + (overlap_match * 0.3), 3)
    assert conf_match == expected_match, f"Expected {expected_match}, got {conf_match}"

    # Query with mismatched entity (e.g. Ramu vs Rajan)
    conf_mismatch, overlap_mismatch = engine.calculate_dynamic_confidence("Ramu at RGUKT", fake_chunk, 0.20)
    assert overlap_mismatch == 0.0, f"Expected 0.0 overlap for Ramu, got {overlap_mismatch}"
    expected_mismatch = round((0.20 * 0.7) + (0.0 * 0.3), 3)
    assert conf_mismatch == expected_mismatch, f"Expected {expected_mismatch}, got {conf_mismatch}"
    print(f"\n[DYNAMIC CONFIDENCE TEST PASSED]: Mathematical formula verified ({conf_match} vs {conf_mismatch}).")
