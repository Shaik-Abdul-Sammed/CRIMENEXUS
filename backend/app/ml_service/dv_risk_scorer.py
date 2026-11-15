from typing import List, Dict, Any, Optional

class DVRiskScorer:
    """
    Domestic Violence (DV) Fatality Risk Scorer.
    Based on Jacquelyn Campbell's Danger Assessment (DA) and ODARA instruments.
    Assesses intimate partner homicide/lethality probability with statutory
    protection directives under Protection of Women from Domestic Violence Act 2005
    and Bharatiya Nyaya Sanhita (BNS) 2023 Section 85 & 86.
    """

    DA_QUESTIONS = [
        {"id": "DA_01", "text": "Has the physical violence increased in severity or frequency over the past year?", "weight": 4.0},
        {"id": "DA_02", "text": "Does the abuser own or have access to a firearm / lethal weapon?", "weight": 5.0},
        {"id": "DA_03", "text": "Has he/she ever tried to choke or strangle the victim? (Non-fatal strangulation)", "weight": 5.0},
        {"id": "DA_04", "text": "Has the abuser ever threatened to kill the victim or children?", "weight": 4.0},
        {"id": "DA_05", "text": "Does the victim believe the abuser is capable of killing them?", "weight": 4.0},
        {"id": "DA_06", "text": "Has the abuser ever forced the victim into sexual acts?", "weight": 3.0},
        {"id": "DA_07", "text": "Is the abuser violently or constantly jealous / controlling?", "weight": 2.5},
        {"id": "DA_08", "text": "Does the abuser use illegal drugs or binge alcohol heavily?", "weight": 2.0},
        {"id": "DA_09", "text": "Has the victim recently left or separated from the abuser?", "weight": 4.0},
        {"id": "DA_10", "text": "Has the abuser ever threatened or attempted suicide?", "weight": 2.5}
    ]

    def score_assessment(
        self,
        case_id: str,
        victim_alias: str,
        affirmed_question_ids: List[str],
        children_involved: bool = False
    ) -> Dict[str, Any]:
        total_raw = sum(
            q["weight"] for q in self.DA_QUESTIONS if q["id"] in affirmed_question_ids
        )
        if children_involved:
            total_raw += 3.0

        # Max raw score = 39.0
        lethality_score = min(100.0, round((total_raw / 39.0) * 100.0, 1))

        # Strangulation is an independent 7x lethality multiplier
        has_strangulation = "DA_03" in affirmed_question_ids
        has_firearm = "DA_02" in affirmed_question_ids

        if lethality_score >= 65.0 or (has_strangulation and has_firearm):
            risk_tier = "EXTREME_LETHALITY_RISK"
            protocol = "Immediate emergency shelter dispatch, Sec 18 DV Act protection order filing, non-bailable arrest under BNS Sec 85/86"
        elif lethality_score >= 40.0 or has_strangulation:
            risk_tier = "HIGH_LETHALITY_RISK"
            protocol = "Safety planning, GPS ankle monitor advisory, urgent magistrate hearing for residence order"
        elif lethality_score >= 20.0:
            risk_tier = "ELEVATED_RISK"
            protocol = "Counseling liaison, weekly police beat officer check-in"
        else:
            risk_tier = "BASELINE_RISK"
            protocol = "Standard civil dispute monitoring"

        return {
            "case_id": case_id,
            "victim_alias": victim_alias,
            "lethality_score": lethality_score,
            "risk_tier": risk_tier,
            "strangulation_flag": has_strangulation,
            "weapon_access_flag": has_firearm,
            "affirmed_factors_count": len(affirmed_question_ids),
            "safety_protocol": protocol,
            "statutory_relief": "Protection Order under Section 18 of DV Act 2005 & Custody Order under Section 21"
        }

_dv_scorer = DVRiskScorer()

def get_dv_risk_scorer() -> DVRiskScorer:
    return _dv_scorer
