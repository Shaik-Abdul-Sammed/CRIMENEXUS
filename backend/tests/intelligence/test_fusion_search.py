import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_fusion_search_happy_path():
    """Test Feature 1: Fusion search returns results from multiple sources (PostgreSQL + Neo4j + ChromaDB)."""
    response = client.post(
        "/api/v1/intelligence/fusion-search",
        json={"query": "hawala", "entity_types": ["CASES", "PERSONS", "PHONES", "SEMANTIC"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert "grouped_results" in data
    assert data["total_matches"] >= 2
    
    # Verify multi-source attribution
    sources = set()
    for cat, items in data["grouped_results"].items():
        for item in items:
            sources.add(item["source"])
    assert len(sources) >= 2, f"Expected results from at least 2 sources, got: {sources}"

def test_fusion_search_filtered_entity_types():
    """Test Feature 1 Edge Case: Searching only specific entity types."""
    response = client.post(
        "/api/v1/intelligence/fusion-search",
        json={"query": "Scorpio", "entity_types": ["VEHICLES"]}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["grouped_results"]["vehicles"]) >= 1
    assert len(data["grouped_results"]["persons"]) == 0

def test_fusion_search_health_endpoint():
    """Test Feature 1 Health: Health verification endpoint returns 200."""
    response = client.get("/api/v1/intelligence-fusion/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
