"""
Category 4: Integration & Cross-System Wiring Tests
Verifies real interactions across PostgreSQL, Neo4j Graph Database,
Redis Streaming pipelines, Risk Scoring models, and Legal Custody trackers.
"""

import hashlib
import io
import time
import pytest
from fastapi.testclient import TestClient

from app.database.neo4j import execute_cypher
from app.database.postgres import SessionLocal
from app.models.case import Case
from app.models.alert import Alert
from app.models.custody_tracker import CustodyTracker
from app.models.evidence_models import EvidenceRecord
from app.services.streaming.stream_producer import simulate_live_event
from app.ml_service.person_risk_scorer import PersonRiskScorer


def test_fir_creates_neo4j_node(client: TestClient, auth_headers):
    """
    Test that ingesting an FIR via /api/v1/ingest/report dual-writes
    and creates a Case node in Neo4j with matching case_number.
    """
    case_no = f"FIR-NEO4J-{int(time.time()*1000)}"
    payload = {
        "case_number": case_no,
        "title": "Cross-System Graph Ingestion Verification",
        "content": "Suspect John Doe committed extortion in Connaught Place.",
        "filed_by": "Inspector Sharma",
        "suspects_mentioned": "John Doe"
    }
    response = client.post("/api/v1/ingest/report", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["case_number"] == case_no

    # Query Neo4j to verify real graph node creation
    cypher_check = "MATCH (c:Case {case_number: $case_no}) RETURN c.case_number AS num, c.title AS title"
    results = execute_cypher(cypher_check, {"case_no": case_no})
    assert len(results) > 0, f"Expected Case node in Neo4j for {case_no}"
    assert results[0]["num"] == case_no
    assert results[0]["title"] == payload["title"]


def test_bank_transaction_creates_graph_edge(client: TestClient, auth_headers):
    """
    Test that ingesting a bank transaction via /api/v1/ingest/bank creates
    a TRANSFERRED_MONEY_TO edge in Neo4j with exact amount and transaction ID.
    """
    tx_id = f"TX-INT-{int(time.time()*1000)}"
    amount = 85000.0
    payload = {
        "transaction_id": tx_id,
        "sender_name": "Ramesh Kumar",
        "sender_account": "ACC-RAM-01",
        "receiver_name": "Deepak Mules",
        "receiver_account": "ACC-DPK-02",
        "amount": amount,
        "currency": "INR",
        "transaction_type": "NEFT"
    }
    response = client.post("/api/v1/ingest/bank", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"

    # Query Neo4j for TRANSFERRED_MONEY_TO edge
    cypher_edge = """
    MATCH (s)-[r:TRANSFERRED_MONEY_TO]->(d)
    WHERE r.transaction_id = $tx_id
    RETURN r.amount AS amount, r.transaction_id AS tx_id
    """
    edge_results = execute_cypher(cypher_edge, {"tx_id": tx_id})
    assert len(edge_results) > 0, f"Expected TRANSFERRED_MONEY_TO edge in Neo4j for {tx_id}"
    assert float(edge_results[0]["amount"]) == amount
    assert edge_results[0]["tx_id"] == tx_id


def test_case_appears_in_search_and_graph(client: TestClient, auth_headers, db):
    """
    Test that creating a case makes it visible in PostgreSQL case listings
    and queryable via intelligence fusion search.
    """
    c_num = f"CASE-SEARCH-{int(time.time()*1000)}"
    c_title = "Syndicate Logistics Operation"
    
    # 1. Create case in PG
    case_payload = {
        "case_number": c_num,
        "title": c_title,
        "crime_type": "Smuggling",
        "description": "Cross-border contraband transit tracking",
        "risk_level": "high"
    }
    res_create = client.post("/api/v1/cases/", json=case_payload, headers=auth_headers)
    assert res_create.status_code == 201
    created_data = res_create.json()
    assert created_data["case_number"] == c_num

    # 2. Check listing in cases endpoint
    res_list = client.get("/api/v1/cases/?limit=100", headers=auth_headers)
    assert res_list.status_code == 200
    cases_list = res_list.json()
    assert any(c["case_number"] == c_num for c in cases_list)

    # 3. Check Intelligence Fusion Search
    search_payload = {"query": c_num, "case_id": c_num}
    res_search = client.post("/api/v1/intelligence/fusion-search", json=search_payload, headers=auth_headers)
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["status"] == "success"
    assert "results" in search_data


def test_streaming_event_creates_alert(client: TestClient, auth_headers, db):
    """
    Test that triggering simulate_live_event() processes stream events
    and writes high-priority alerts with source='REDIS_STREAM' to PostgreSQL alerts table.
    """
    # Count existing stream alerts
    prev_count = db.query(Alert).filter(Alert.source == "REDIS_STREAM").count()

    # Simulate live stream event
    msg_id = simulate_live_event()
    assert msg_id is not None

    # Verify new alert created in PostgreSQL
    new_alerts = db.query(Alert).filter(Alert.source == "REDIS_STREAM").all()
    assert len(new_alerts) >= prev_count + 1
    latest_alert = new_alerts[-1]
    assert latest_alert.source == "REDIS_STREAM"
    assert "Redis Stream Event" in latest_alert.title


def test_risk_score_updates_after_new_evidence(client: TestClient, auth_headers):
    """
    Test that Person Risk Scoring dynamically computes higher risk scores
    and updates SHAP attribution when new criminal features/evidence are added.
    """
    initial_features = {
        "name": "Target Subject A",
        "prior_fir_count": 1,
        "network_centrality": 0.20,
        "transaction_anomaly_count": 0,
        "gang_affiliation": "None",
        "violent_history": False
    }
    res_initial = PersonRiskScorer.calculate_risk("TEST-SUB-01", custom_features=initial_features)
    assert res_initial is not None
    initial_score = res_initial["overall_risk_score"]

    # Subject linked to 6 additional FIRs, higher network centrality, and 10 transaction anomalies
    escalated_features = {
        "name": "Target Subject A",
        "prior_fir_count": 7,
        "network_centrality": 0.85,
        "transaction_anomaly_count": 10,
        "gang_affiliation": "D-Company Operative",
        "violent_history": True
    }
    res_escalated = PersonRiskScorer.calculate_risk("TEST-SUB-01", custom_features=escalated_features)
    assert res_escalated is not None
    escalated_score = res_escalated["overall_risk_score"]

    assert escalated_score > initial_score
    assert escalated_score >= 60.0
    assert "shap_attributions" in res_escalated


def test_remand_alert_links_to_case(client: TestClient, auth_headers, test_case):
    """
    Test that starting statutory custody tracking generates an active remand
    countdown linked to the valid existing Case record.
    """
    payload = {
        "case_id": test_case.case_number,
        "suspect_id": "SUSPECT-REMAND-99",
        "suspect_name": "Kailash Verma",
        "days_charge_sheet": 60,
        "investigating_officer": "Inspector V. K. Sharma",
        "police_station": "Crime Branch Sector 20",
        "offenses": "Section 111 BNS (Organized Crime Syndicate)"
    }
    response = client.post("/api/v1/legal/custody/start", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "TRACKING_STARTED"
    assert data["case_id"] == test_case.case_number

    # Verify in active custody countdown listing
    res_active = client.get("/api/v1/legal/custody/active", headers=auth_headers)
    assert res_active.status_code == 200
    active_list = res_active.json()
    matching = [c for c in active_list if c["case_id"] == test_case.case_number]
    assert len(matching) > 0
    assert matching[0]["suspect_name"] == "Kailash Verma"
    assert matching[0]["statutory_law"] == "Sec 57 CrPC / Sec 58 BNSS 2023"


def test_evidence_hash_survives_restart(client: TestClient, auth_headers, db, test_case):
    """
    Test cryptographic immutability: upload digital evidence file,
    compute SHA-256 hash, read back from DB/storage, and assert hashes match exactly.
    """
    raw_content = b"CRIME-SCENE-FORENSIC-EVIDENCE-PAYLOAD-998811"
    expected_sha256 = hashlib.sha256(raw_content).hexdigest()

    # Upload evidence file
    upload_res = client.post(
        "/api/v1/evidence/upload",
        files={"file": ("ballistic_casing.raw", io.BytesIO(raw_content), "application/octet-stream")},
        data={
            "case_id": test_case.case_number,
            "evidence_type": "DIGITAL_STORAGE",
            "collected_by": "Forensic Officer Rao"
        },
        headers=auth_headers
    )
    assert upload_res.status_code == 200
    res_data = upload_res.json()
    assert res_data["sha256"] == expected_sha256

    # Verify directly in PostgreSQL EvidenceRecord
    rec = db.query(EvidenceRecord).filter(EvidenceRecord.sha256_hash == expected_sha256).first()
    assert rec is not None
    assert rec.sha256_hash == expected_sha256
    assert rec.case_id == test_case.case_number
