import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.ml_service.dv_risk_scorer import get_dv_risk_scorer
from app.database.postgres import SessionLocal
from app.models.case import Case
from app.models.audit_ledger import AuditLedgerEntry

logger = logging.getLogger("crimenexus.dv_risk")

router = APIRouter(tags=["Domestic Violence (DV) Fatality Risk Assessment"])

class DVAssessmentRequest(BaseModel):
    case_id: str
    victim_alias: str
    affirmed_question_ids: List[str]
    children_involved: bool = False

@router.get("/dv-risk/health", summary="DV Risk Health Check")
@router.get("/dv/health", summary="DV Health Check")
def dv_health():
    return {
        "status": "healthy",
        "service": "Domestic Violence Fatality & Lethality Risk Engine (Campbell DA)",
        "frameworks": ["Campbell Danger Assessment (DA)", "ODARA"],
        "version": "1.0.0"
    }

@router.get("/dv/questions", summary="Get Danger Assessment Questionnaire")
def get_da_questions():
    scorer = get_dv_risk_scorer()
    return scorer.DA_QUESTIONS

@router.get("/dv/cases", summary="Get Tracked DV Assessments")
def get_tracked_dv_cases():
    results = []
    try:
        db = SessionLocal()
        try:
            records = db.query(AuditLedgerEntry).filter(AuditLedgerEntry.resource_type == "DV_ASSESSMENT").limit(20).all()
            for r in records:
                try:
                    payload = json.loads(r.details) if r.details else {}
                except Exception:
                    payload = {}
                results.append(payload)
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Error fetching DV cases: %s", exc)
    return results

@router.post("/dv/assess", summary="Assess DV Fatality & Lethality Score")
@router.post("/dv-risk/assess", summary="Assess DV Fatality & Lethality Score")
def assess_dv_risk(payload: DVAssessmentRequest):
    scorer = get_dv_risk_scorer()
    res = scorer.score_assessment(
        case_id=payload.case_id,
        victim_alias=payload.victim_alias,
        affirmed_question_ids=payload.affirmed_question_ids,
        children_involved=payload.children_involved
    )

    # Persist and update Case risk level in PostgreSQL
    try:
        db = SessionLocal()
        try:
            # If high or extreme lethality, update case risk in PostgreSQL
            c = db.query(Case).filter(Case.case_number == payload.case_id).first()
            if c and res.get("lethality_score", 0) >= 65.0:
                c.risk_level = "critical"
                db.commit()

            import hashlib
            raw_hash = hashlib.sha256(f"{payload.case_id}|{res.get('lethality_score')}|{datetime.utcnow().isoformat()}".encode()).hexdigest()
            entry = AuditLedgerEntry(
                officer_badge="DV-LIAISON-OFFICER",
                officer_name="Specialized DV / Crimes Against Women IO",
                station_id="CAW_CELL",
                action="DV_CAMPBELL_LETHALITY_ASSESSMENT",
                resource_type="DV_ASSESSMENT",
                resource_id=payload.case_id,
                details=json.dumps(res),
                previous_hash="0"*64,
                current_hash=raw_hash
            )
            db.add(entry)
            db.commit()
        finally:
            db.close()
    except Exception as db_err:
        logger.warning("Error recording DV assessment to database: %s", db_err)

    return res
