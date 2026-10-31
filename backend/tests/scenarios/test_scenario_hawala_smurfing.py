"""
Police Workflow Scenario 2: Hawala Money Smurfing & Layering Syndicate.
Workflow:
  1. Ingestion of 5 structured transactions of ₹49,500 from 5 distinct mule senders
     to single beneficiary account ACC-HAWALA-BENEFICIARY within 6 hours.
  2. Financial Anomaly Detector (Isolation Forest & Rule-based tripwire) flags smurfing incident.
  3. Tripwire alert is written to PostgreSQL with freeze recommendation.
  4. Generative AI RAG Engine drafts a formal Section 102 CrPC / Sec 106 BNSS Bank Freeze Notice.
"""

import uuid
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.postgres import SessionLocal
from app.models.transaction import BankTransaction
from app.models.alert import Alert
from app.services.streaming.redis_streams import get_redis_client

client = TestClient(app)


def test_scenario_hawala_smurfing_investigation():
    db = SessionLocal()
    target_beneficiary = f"ACC-HAWALA-MULE-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()

    # 1. Five transactions of ₹49,500 from 5 distinct senders to same beneficiary
    txs = [
        BankTransaction(
            transaction_id=f"TX-HAWALA-{i}-{uuid.uuid4().hex[:6].upper()}",
            sender_name=f"Cash Mule Operator {i}",
            sender_account=f"ACC-SRC-MULE-{i}-{uuid.uuid4().hex[:4]}",
            receiver_name="Hawala Syndicate Mastermind",
            receiver_account=target_beneficiary,
            amount=49500.0,
            currency="INR",
            transaction_type="IMPS",
            timestamp=now - timedelta(hours=i)
        )
        for i in range(1, 6)
    ]

    try:
        for tx in txs:
            db.add(tx)
        db.commit()

        # Invalidate smurfing Redis cache to ensure fresh query
        r = get_redis_client()
        if r:
            try:
                for k in r.keys("cache:analytics:smurfing:*"):
                    r.delete(k)
            except Exception:
                pass

        # 2. Financial smurfing detection API
        res = client.get("/api/v1/analytics/smurfing?window_hours=12&min_senders=3")
        assert res.status_code == 200, f"Smurfing API failed: {res.text}"
        data = res.json()

        incidents = data.get("incidents", [])
        matched = next((inc for inc in incidents if inc["beneficiary_account"] == target_beneficiary), None)
        assert matched is not None, f"Target beneficiary {target_beneficiary} was not flagged as smurfing incident"
        assert matched["distinct_senders_count"] >= 5
        assert matched["total_amount"] == 49500.0 * 5

        # 3. Verify Alert generated with freeze recommendation in DB
        alert = db.query(Alert).filter(Alert.title.contains(target_beneficiary)).first()
        assert alert is not None, f"Financial Tripwire alert was not logged for {target_beneficiary}"
        assert alert.alert_type == "FINANCIAL_TRIPWIRE"
        assert alert.severity in ["critical", "high"]

        # 4. Generative AI RAG Engine drafts Section 102 CrPC Bank Freeze Notice
        draft_res = client.post(
            f"/api/v1/draft/bank-notice/{target_beneficiary}",
            json={
                "bank_name": "State Bank of India, SME Branch",
                "reason": "Hawala money smurfing structuring deposits (5 x Rs 49,500) under Section 102 CrPC / Sec 106 BNSS"
            }
        )
        assert draft_res.status_code == 200, f"Draft notice failed: {draft_res.text}"
        draft_data = draft_res.json()
        assert target_beneficiary in draft_data["draft_text"]
        assert "Section 102" in draft_data["draft_text"] or "102 Cr.P.C." in draft_data["draft_text"]
        assert "freeze" in draft_data["draft_text"].lower() or "debit" in draft_data["draft_text"].lower()

    finally:
        for tx in txs:
            db.delete(tx)
        db.query(Alert).filter(Alert.title.contains(target_beneficiary)).delete()
        db.commit()
        db.close()
