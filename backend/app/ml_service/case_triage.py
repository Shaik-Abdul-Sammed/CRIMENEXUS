from typing import List, Dict, Any, Optional

class CaseTriageEngine:
    """
    AI-Powered Case Solvability & Priority Triage Engine.
    Implements RAND Corporation Solvability Factors and UK National Decision Model.
    Computes solvability probability and highlights perishable 'golden hour' investigative leads.
    """

    SOLVABILITY_WEIGHTS = {
        "named_suspect": 30.0,
        "vehicle_license_plate": 20.0,
        "cctv_footage_available": 18.0,
        "identifiable_physical_evidence": 15.0, # DNA or Fingerprints
        "cooperative_eyewitness": 12.0,
        "unique_modus_operandi": 10.0,
        "traceable_stolen_property": 8.0,
        "victim_can_identify_suspect": 15.0
    }

    def evaluate_case(
        self,
        case_id: str,
        offense_category: str,
        present_factors: List[str],
        hours_since_occurrence: float = 4.0
    ) -> Dict[str, Any]:
        raw_score = sum(self.SOLVABILITY_WEIGHTS.get(factor, 0.0) for factor in present_factors)
        
        # Golden hour perishable decay factor (evidence decays as time elapses)
        if hours_since_occurrence <= 8.0:
            golden_multiplier = 1.15
        elif hours_since_occurrence <= 24.0:
            golden_multiplier = 1.0
        elif hours_since_occurrence <= 72.0:
            golden_multiplier = 0.85
        else:
            golden_multiplier = 0.70

        solvability_score = min(100.0, round((raw_score / 128.0) * 100.0 * golden_multiplier, 1))

        # Determine priority tier
        if solvability_score >= 70.0 or "named_suspect" in present_factors:
            tier = "IMMEDIATE_DISPATCH (TIER 1)"
            action = "Assign dedicated investigating officer immediately; freeze CCTV and initiate CDR tower dump."
        elif solvability_score >= 40.0:
            tier = "PRIORITY_INVESTIGATION (TIER 2)"
            action = "Secondary evidence collection, forensic canvassing within 24 hours."
        else:
            tier = "STANDARD_SCRUTINY (TIER 3)"
            action = "Area intelligence cross-matching; cluster with active syndicate pattern analysis."

        # Perishable lead warnings
        perishable_leads = []
        if "cctv_footage_available" in present_factors and hours_since_occurrence > 20.0:
            perishable_leads.append("CCTV DVR overwrite risk: Secure recording immediately within 4 hours.")
        if hours_since_occurrence < 48.0:
            perishable_leads.append("Cell Tower BTS buffer purge: File 91 CrPC notice with telecom operators.")

        return {
            "case_id": case_id,
            "offense_category": offense_category,
            "solvability_score": solvability_score,
            "priority_tier": tier,
            "hours_since_incident": hours_since_occurrence,
            "factors_present_count": len(present_factors),
            "recommended_dispatch_action": action,
            "perishable_leads_alert": perishable_leads,
            "statutory_mandate": "BNSS 2023 Sec 173 (Cognizable Offense Preliminary Enquiry / FIR Registration)"
        }

_triage_engine = CaseTriageEngine()

def get_case_triage_engine() -> CaseTriageEngine:
    return _triage_engine
