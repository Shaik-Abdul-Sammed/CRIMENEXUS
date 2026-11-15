import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("crimenexus.threat_assessment")

class ThreatAssessmentEngine:
    """
    Threat Assessment Tool based on TRAP-18 (Terrorist Radicalization Assessment Protocol)
    and WAVR-21 (Workplace & Public Safety Violence Risk).
    Quantifies Pathway to Targeted Violence using 8 Proximal Warning Behaviors
    and 10 Distal Characteristics, augmented with RAG-grounded case law and statutory directives.
    """

    PROXIMAL_BEHAVIORS = [
        {"id": "PROX_01", "name": "Pathway Warning Behavior", "weight": 3.0, "desc": "Research, planning, preparation, or implementation of targeted attack"},
        {"id": "PROX_02", "name": "Fixation Warning Behavior", "weight": 2.5, "desc": "Increasingly pathological preoccupation with a person, group, or cause"},
        {"id": "PROX_03", "name": "Identification Warning Behavior", "weight": 2.5, "desc": "Desire to be a 'pseudocommando' or identify with previous mass killers"},
        {"id": "PROX_04", "name": "Novel Aggression Warning Behavior", "weight": 2.0, "desc": "Act of violence unrelated to the pathway to test operational ability"},
        {"id": "PROX_05", "name": "Energy Burst Warning Behavior", "weight": 2.0, "desc": "Acceleration of activity in the days/weeks preceding planned event"},
        {"id": "PROX_06", "name": "Leakage Warning Behavior", "weight": 3.0, "desc": "Communication to a third party of intent to do harm or attack"},
        {"id": "PROX_07", "name": "Last Resort Warning Behavior", "weight": 3.0, "desc": "Evidence of action imperative, despair, 'time is running out'"},
        {"id": "PROX_08", "name": "Directly Communicated Threat", "weight": 3.5, "desc": "Unambiguous communication of threat to target or law enforcement"}
    ]

    DISTAL_CHARACTERISTICS = [
        {"id": "DIST_01", "name": "Personal Grievance & Moral Outrage", "weight": 1.5},
        {"id": "DIST_02", "name": "Framed by an Ideology", "weight": 1.5},
        {"id": "DIST_03", "name": "Failure to Affiliate with Extremist Group", "weight": 1.0},
        {"id": "DIST_04", "name": "Dependence on Virtual Community", "weight": 1.0},
        {"id": "DIST_05", "name": "Failure of Sex-Pair / Intimate Bonding", "weight": 1.0},
        {"id": "DIST_06", "name": "Major Mental Disorder / Paranoia", "weight": 1.5},
        {"id": "DIST_07", "name": "Greater Creativity & Innovation", "weight": 1.0},
        {"id": "DIST_08", "name": "History of Criminal Violence", "weight": 1.5},
        {"id": "DIST_09", "name": "Firearms or Explosive Experience", "weight": 2.0},
        {"id": "DIST_10", "name": "Recent Life Failure or Loss", "weight": 1.5}
    ]

    def evaluate_threat(
        self,
        subject_id: str,
        subject_name: str,
        active_proximal_ids: List[str],
        active_distal_ids: List[str],
        narrative: Optional[str] = ""
    ) -> Dict[str, Any]:
        # Compute scores
        prox_score = 0.0
        prox_matches = []
        for p in self.PROXIMAL_BEHAVIORS:
            if p["id"] in active_proximal_ids:
                prox_score += p["weight"]
                prox_matches.append(p)

        dist_score = 0.0
        dist_matches = []
        for d in self.DISTAL_CHARACTERISTICS:
            if d["id"] in active_distal_ids:
                dist_score += d["weight"]
                dist_matches.append(d)

        # Max proximal = 21.5, Max distal = 14.0 -> Total max = 35.5
        total_raw = prox_score + dist_score
        threat_index = min(100.0, round((total_raw / 35.5) * 100.0, 1))

        if threat_index >= 70.0 or len(prox_matches) >= 4:
            priority_tier = "LEVEL_1_IMMINENT_CRITICAL"
            recommended_action = "Immediate physical surveillance, Section 170 BNSS preventive custody warrant, weapon interdiction"
        elif threat_index >= 45.0 or len(prox_matches) >= 2:
            priority_tier = "LEVEL_2_ELEVATED_RISK"
            recommended_action = "Active digital monitoring, neighborhood liaison, mental health/deradicalization intervention"
        else:
            priority_tier = "LEVEL_3_BASELINE_MONITORING"
            recommended_action = "Periodic intelligence review and social media watch"

        # Ground with RAG engine for relevant statutory case law & precedents
        rag_precedents = []
        try:
            from app.ml_service.rag_engine import get_rag_engine
            rag = get_rag_engine()
            query_str = f"Targeted violence prevention, preventive custody, {narrative or subject_name}"
            rag_res = rag.query(query_str, top_k=2)
            for doc in rag_res.get("retrieved_documents", []):
                rag_precedents.append({
                    "title": doc.get("title", "Statutory Precedent"),
                    "text_snippet": doc.get("text", "")[:120],
                    "relevance_score": doc.get("relevance_score", 0.85)
                })
        except Exception as rag_err:
            logger.warning("RAG precedent lookup for threat assessment skipped: %s", rag_err)

        result = {
            "subject_id": subject_id,
            "subject_name": subject_name,
            "threat_index": threat_index,
            "priority_tier": priority_tier,
            "proximal_behaviors_count": len(prox_matches),
            "distal_characteristics_count": len(dist_matches),
            "proximal_matches": prox_matches,
            "distal_matches": dist_matches,
            "recommended_action": recommended_action,
            "rag_statutory_precedents": rag_precedents,
            "statutory_compliance": "Sec 170 BNSS (Arrest to Prevent Cognizable Offenses) & Sec 111 BNSS (Organized Terror Threat)"
        }

        # Persist assessment to PostgreSQL AuditLedgerEntry
        try:
            from app.database.postgres import SessionLocal
            from app.models.audit_ledger import AuditLedgerEntry
            import hashlib
            db = SessionLocal()
            try:
                raw_hash = hashlib.sha256(f"{subject_id}|{threat_index}|{datetime.utcnow().isoformat()}".encode()).hexdigest()
                entry = AuditLedgerEntry(
                    officer_badge="CT-INTEL-OFFICER",
                    officer_name="Counter-Terror Threat Analyst",
                    station_id="SPECIAL_CELL_HQ",
                    action="TARGETED_VIOLENCE_THREAT_ASSESSMENT",
                    resource_type="THREAT_ASSESSMENT",
                    resource_id=subject_id,
                    details=json.dumps(result),
                    previous_hash="0"*64,
                    current_hash=raw_hash
                )
                db.add(entry)
                db.commit()
            finally:
                db.close()
        except Exception as audit_exc:
            logger.warning("Error persisting threat assessment to audit ledger: %s", audit_exc)

        return result

_threat_engine = ThreatAssessmentEngine()

def get_threat_engine() -> ThreatAssessmentEngine:
    return _threat_engine
