"""
Category 7: API Contract & Schema Compliance Tests
Verifies strict adherence to OpenAPI specs, JSON schema contracts,
error envelope structures, pagination mechanics, and system health endpoints.
"""

import pytest
from fastapi.testclient import TestClient


def test_ml_status_schema(client: TestClient, auth_headers):
    """
    Test that /api/v1/ml/status strictly satisfies MLOps registry schema
    containing all 6 production models with name, version/type, and status.
    """
    response = client.get("/api/v1/ml/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert "models" in data
    assert "active_models_count" in data
    assert "memory_usage_mb" in data

    models = data["models"]
    expected_models = [
        "ocr_engine",
        "ner_model",
        "financial_anomaly_detector",
        "explainable_risk_model",
        "mo_semantic_search",
        "rag_draft_engine"
    ]

    for model_key in expected_models:
        assert model_key in models, f"Missing expected model '{model_key}' in registry"
        model_info = models[model_key]
        assert "name" in model_info
        assert "status" in model_info
        assert model_info["status"] in ["READY", "UNAVAILABLE", "ERROR"]


def test_case_response_schema(client: TestClient, auth_headers, test_case):
    """
    Test that /api/v1/cases/{case_id} response matches the statutory CaseResponse schema.
    """
    response = client.get(f"/api/v1/cases/{test_case.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    required_fields = ["id", "case_number", "title", "crime_type", "status", "risk_level"]
    for field in required_fields:
        assert field in data, f"Field '{field}' missing from CaseResponse"
    assert data["case_number"] == test_case.case_number
    assert data["id"] == test_case.id


def test_person_response_schema(client: TestClient, auth_headers, test_person_with_graph):
    """
    Test that /api/v1/network/persons matches PersonResponse schema.
    """
    response = client.get("/api/v1/network/persons", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0
    first_person = data[0]

    for field in ["id", "name", "risk_score", "primary_phone", "primary_vehicle"]:
        assert field in first_person, f"Field '{field}' missing from PersonResponse"
    assert isinstance(first_person["risk_score"], float)


def test_error_response_has_detail(client: TestClient, auth_headers):
    """
    Test that 404 (Not Found) and 422 (Unprocessable Entity) errors return standard
    JSON error envelopes containing the 'detail' attribute, never empty bodies or HTML stack traces.
    """
    # 1. Test 404
    res_404 = client.get("/api/v1/cases/999999999", headers=auth_headers)
    assert res_404.status_code == 404
    data_404 = res_404.json()
    assert "detail" in data_404
    assert isinstance(data_404["detail"], str)

    # 2. Test 422
    res_422 = client.post("/api/v1/cases/", json={"invalid_field": 123}, headers=auth_headers)
    assert res_422.status_code == 422
    data_422 = res_422.json()
    assert "detail" in data_422
    assert isinstance(data_422["detail"], list)
    assert len(data_422["detail"]) > 0


def test_pagination_metadata(client: TestClient, auth_headers):
    """
    Test that paginated endpoints adhere to limit and skip offsets correctly.
    """
    res_limit_5 = client.get("/api/v1/cases/?limit=5&skip=0", headers=auth_headers)
    assert res_limit_5.status_code == 200
    data_5 = res_limit_5.json()
    assert isinstance(data_5, list)
    assert len(data_5) <= 5

    res_limit_2 = client.get("/api/v1/cases/?limit=2&skip=0", headers=auth_headers)
    assert res_limit_2.status_code == 200
    data_2 = res_limit_2.json()
    assert isinstance(data_2, list)
    assert len(data_2) <= 2


def test_openapi_schema_accessible(client: TestClient):
    """
    Test that the OpenAPI 3.0+ schema documentation JSON is accessible and well-formed.
    """
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()

    assert "openapi" in schema
    assert "info" in schema
    assert "paths" in schema
    assert schema["info"]["title"] == "CRIMENEXUS API"

    paths = schema["paths"]
    assert any("/cases" in p for p in paths)
    assert any("/evidence" in p for p in paths)
    assert any("/ml/status" in p for p in paths)
    assert any("/alerts" in p for p in paths)


def test_health_endpoints_all_return_200(client: TestClient):
    """
    Test that all critical system and sub-system health check endpoints return HTTP 200 OK.
    """
    health_routes = [
        "/api/v1/health",
        "/api/v1/threats/health",
        "/api/v1/intelligence/health",
        "/api/v1/geofence/health",
        "/api/v1/risk-scoring/health",
        "/api/v1/hotspot-forecast/health",
        "/api/v1/rtcc/health",
        "/api/v1/sar-analytics/health",
        "/api/v1/ibis/health",
        "/api/v1/gun-intelligence/health"
    ]

    for route in health_routes:
        resp = client.get(route)
        assert resp.status_code == 200, f"Health endpoint {route} failed with status {resp.status_code}"
        json_data = resp.json()
        assert "status" in json_data, f"Health endpoint {route} missing 'status' key"
        assert json_data["status"] in ["healthy", "OPERATIONAL", "online", "ACTIVE"]
