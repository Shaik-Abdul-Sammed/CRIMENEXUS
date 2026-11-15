import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.ml_service.person_risk_scorer import PersonRiskScorer, PERSON_FEATURE_DB
from app.services.legal.fairness_auditor import get_fairness_auditor
from app.database.postgres import SessionLocal
from app.models.audit_ledger import AuditLedgerEntry

logger = logging.getLogger("crimenexus.risk_scoring")

router = APIRouter(prefix="/risk-scoring", tags=["Predictive Risk Scoring"])

class HumanReviewOverrideRequest(BaseModel):
    officer_badge: str
    officer_name: str
    decision: str = Field(..., description="APPROVED_FOR_ACTION, OVERRIDDEN_DOWNGRADED, DISMISSED")
    justification: str

@router.get("/health", summary="Person Risk Scorer Health")
def risk_scoring_health():
    return {
        "status": "healthy",
        "service": "Person-Based Predictive Risk Scoring & SHAP Explainer",
        "model_architecture": "XGBoost-Explainable Regression",
        "gdpr_safeguards": ["Article 22 Human-in-the-Loop Gate >= 80", "Four-Fifths Rule Fairness Monitoring"],
        "version": "1.0.0"
    }

@router.get("/person/{person_id}", summary="Get Person Predictive Risk Score & SHAP Breakdown")
def get_person_risk(person_id: str):
    res = PersonRiskScorer.calculate_risk(person_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Subject '{person_id}' not found in active police nominal roll or syndicate database.")
    return res

@router.post("/person/{person_id}/human-review", summary="GDPR Art. 22 Officer Review Sign-Off on High Risk Scores")
def submit_human_review(person_id: str, payload: HumanReviewOverrideRequest):
    res = PersonRiskScorer.calculate_risk(person_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Subject '{person_id}' not found.")

    res["human_review_status"] = payload.decision
    res["reviewing_officer"] = f"{payload.officer_name} ({payload.officer_badge})"
    res["review_timestamp"] = datetime.utcnow().isoformat()
    res["officer_justification"] = payload.justification

    # Log sign-off into PostgreSQL AuditLedgerEntry
    try:
        db = SessionLocal()
        try:
            import hashlib
            raw_hash = hashlib.sha256(f"{person_id}|{payload.officer_badge}|{payload.decision}|{datetime.utcnow().isoformat()}".encode()).hexdigest()
            entry = AuditLedgerEntry(
                officer_badge=payload.officer_badge,
                officer_name=payload.officer_name,
                station_id="SUPERVISORY_REVIEW",
                action="GDPR_ART22_HUMAN_OVERRIDE_EXECUTED",
                resource_type="RISK_SCORE_OVERRIDE",
                resource_id=person_id,
                details=json.dumps(res),
                previous_hash="0"*64,
                current_hash=raw_hash
            )
            db.add(entry)
            db.commit()
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Error recording human review to audit ledger: %s", exc)

    return res

@router.get("/fairness-audit", summary="Get Algorithmic Fairness & Disparate Impact Ratio (DIR) Audit")
def get_algorithmic_fairness_audit():
    auditor = get_fairness_auditor()
    return auditor.audit_case_database()

@router.get("/roster", summary="Get Pre-Scored Investigative Target Roster")
def get_risk_roster():
    items = []
    for pid in PERSON_FEATURE_DB:
        items.append(PersonRiskScorer.calculate_risk(pid))
    return {"roster": items, "count": len(items)}
