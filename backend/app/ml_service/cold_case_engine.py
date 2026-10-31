"""
Cold Case Resurrection Engine for CRIMENEXUS.

Performs automated cross-jurisdiction matching of newly detained suspects, phones,
vehicles, and modus operandi (MO) patterns against historical unsolved / untraced cases.
"""

from typing import Dict, Any, List, Optional


# Default historical repository of untraced / cold cases
SAMPLE_COLD_CASES: List[Dict[str, Any]] = [
    {
        "case_id": "COLD-2021-0812",
        "station_id": "PS_SOUTH_MUMBAI",
        "registered_at": "2021-06-15T09:00:00",
        "status": "UNTRACED",
        "offense": "Armed Bank Heist",
        "phones": ["+919820011223", "+919820099887"],
        "vehicles": ["MH-01-AX-9999"],
        "aliases": ["Kala Pathan", "Sikandar"],
        "mo_summary": "Night-time gas cutter ATM break-in using white pickup truck with fake plates"
    },
    {
        "case_id": "COLD-2022-1405",
        "station_id": "PS_GURUGRAM_CYBER",
        "registered_at": "2022-11-20T14:30:00",
        "status": "COLD",
        "offense": "UPI Phishing Syndicate",
        "phones": ["+919717004455"],
        "bank_accounts": ["SBIN000452188"],
        "aliases": ["Doctor Saheb"],
        "mo_summary": "Electricity bill disconnection SMS fraud targeting senior citizens"
    },
    {
        "case_id": "COLD-2023-0094",
        "station_id": "PS_BENGALURU_EAST",
        "registered_at": "2023-03-05T11:15:00",
        "status": "UNTRACED",
        "offense": "Jewelry Store Heist",
        "vehicles": ["KA-04-MB-4433"],
        "aliases": ["Gulli"],
        "mo_summary": "Tunnel burrowing into jewelry shop locker during festival weekend"
    }
]


def _compute_mo_similarity(text1: str, text2: str) -> float:
    """
    Computes token-based Jaccard similarity between two MO descriptions.
    """
    tokens1 = set(text1.lower().replace(",", " ").replace("-", " ").split())
    tokens2 = set(text2.lower().replace(",", " ").replace("-", " ").split())
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)


def resurrect_cold_cases(
    new_case_data: Dict[str, Any],
    cold_cases: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Scans new arrest/FIR entities against archival cold cases.
    Returns ranked leads where resurrection score > 0.30.
    """
    catalog = cold_cases if cold_cases is not None else SAMPLE_COLD_CASES
    
    new_phones = set(new_case_data.get("phones", []))
    new_vehicles = set(new_case_data.get("vehicles", []))
    new_aliases = {a.lower() for a in new_case_data.get("aliases", [])}
    new_banks = set(new_case_data.get("bank_accounts", []))
    new_mo = new_case_data.get("mo_summary", "")

    resurrection_leads = []

    for cold in catalog:
        matched_indicators = []
        entity_score = 0.0
        
        # Phone check
        common_phones = new_phones.intersection(set(cold.get("phones", [])))
        if common_phones:
            matched_indicators.append(f"Phone match: {list(common_phones)}")
            entity_score += 0.50

        # Vehicle check
        common_vehicles = new_vehicles.intersection(set(cold.get("vehicles", [])))
        if common_vehicles:
            matched_indicators.append(f"Vehicle match: {list(common_vehicles)}")
            entity_score += 0.40

        # Alias check
        cold_aliases = {a.lower() for a in cold.get("aliases", [])}
        common_aliases = new_aliases.intersection(cold_aliases)
        if common_aliases:
            matched_indicators.append(f"Alias match: {list(common_aliases)}")
            entity_score += 0.35

        # Bank check
        common_banks = new_banks.intersection(set(cold.get("bank_accounts", [])))
        if common_banks:
            matched_indicators.append(f"Bank Account match: {list(common_banks)}")
            entity_score += 0.45

        # MO similarity
        mo_sim = _compute_mo_similarity(new_mo, cold.get("mo_summary", ""))
        if mo_sim > 0.15:
            matched_indicators.append(f"Modus Operandi similarity: {round(mo_sim * 100, 1)}%")

        # Total confidence combines direct entity hits and MO similarity
        if entity_score > 0 and mo_sim > 0.1:
            total_confidence = min(1.0, (entity_score * 0.65) + (mo_sim * 0.35))
        elif entity_score > 0:
            total_confidence = min(1.0, entity_score)
        else:
            # Pure MO similarity lead
            total_confidence = min(1.0, mo_sim * 0.8)

        if total_confidence >= 0.20:
            resurrection_leads.append({
                "cold_case_id": cold["case_id"],
                "original_station": cold["station_id"],
                "registered_at": cold["registered_at"],
                "original_offense": cold["offense"],
                "resurrection_confidence": round(total_confidence, 2),
                "matched_indicators": matched_indicators,
                "reopen_recommendation": (
                    "CRITICAL: Immediate custodial interrogation on historical FIR. "
                    "Notify issuing Magistrate for production warrant under Sec 294 BNSS."
                    if total_confidence >= 0.50
                    else "RECOMMENDED: Review old case diary and cross-interrogate suspect."
                )
            })

    # Sort descending by confidence
    resurrection_leads.sort(key=lambda x: x["resurrection_confidence"], reverse=True)
    return resurrection_leads
