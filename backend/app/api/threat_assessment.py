import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.services.threat_assessment import get_threat_engine

logger = logging.getLogger("crimenexus.threat_assessment")

router = APIRouter(tags=["Threat Assessment Tools (TRAP-18 & WAVR-21)"])

class ThreatAssessmentRequest(BaseModel):
    subject_id: str
    subject_name: str
    active_proximal_ids: List[str] = Field(default=[], description="List of active TRAP-18 Proximal Warning IDs")
    active_distal_ids: List[str] = Field(default=[], description="List of active Distal Characteristic IDs")
    narrative: Optional[str] = ""

@router.get("/threat-assessment/health", summary="Threat Assessment Health Check")
@router.get("/threat/health", summary="Threat Health Check")
def threat_assessment_health():
    return {
        "status": "healthy",
        "service": "Threat Assessment & Targeted Violence Prevention (TRAP-18 / WAVR-21)",
        "models": ["TRAP-18 Terrorist Radicalization Assessment Protocol", "WAVR-21 Violence Risk"],
        "version": "1.0.0"
    }

@router.get("/threat/framework-metadata", summary="Get TRAP-18 Framework Behavioral Schema")
def get_framework_metadata():
    engine = get_threat_engine()
    return {
        "proximal_warning_behaviors": engine.PROXIMAL_BEHAVIORS,
        "distal_characteristics": engine.DISTAL_CHARACTERISTICS
    }

@router.post("/threat/assess", summary="Evaluate Targeted Violence Threat Index")
@router.post("/threat-assessment/assess", summary="Evaluate Targeted Violence Threat Index")
def assess_threat(payload: ThreatAssessmentRequest):
    engine = get_threat_engine()
    return engine.evaluate_threat(
        subject_id=payload.subject_id,
        subject_name=payload.subject_name,
        active_proximal_ids=payload.active_proximal_ids,
        active_distal_ids=payload.active_distal_ids,
        narrative=payload.narrative
    )

@router.get("/threat-assessment/{subject_id}", summary="Get Subject Threat Profile")
def get_subject_threat_profile(subject_id: str):
    engine = get_threat_engine()
    # Default benchmark suspect demonstrating Pathway, Fixation, Leakage
    return engine.evaluate_threat(
        subject_id=subject_id,
        subject_name="Ramesh alias Lone-Operative",
        active_proximal_ids=["PROX_01", "PROX_02", "PROX_06", "PROX_08"],
        active_distal_ids=["DIST_01", "DIST_02", "DIST_04", "DIST_09"],
        narrative="Subject posted targeted bomb threats on encrypted telegram channels and reconned sensitive metro stations."
    )
