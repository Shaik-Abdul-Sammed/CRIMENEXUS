import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("crimenexus.legal.ripa_validator")

class RIPAComplianceValidator:
    """
    UK Regulation of Investigatory Powers Act (RIPA) 2000 & Investigatory Powers Act (IPA) 2016
    Authorisation and Proportionality Audit Validator.
    Applies the 4-part judicial proportionality test to communications data / cell-site deployments:
    1. Legitimate Statutory Ground (RIPA Section 22(2))
    2. Necessity (No less intrusive method will achieve the outcome)
    3. Proportionality (Intrusion is balanced against offense severity)
    4. Minimisation of Collateral Intrusion (Bystander privacy safeguards)
    """

    STATUTORY_GROUNDS = [
        "PREVENTING_OR_DETECTING_SERIOUS_CRIME",
        "NATIONAL_SECURITY",
        "PREVENTING_DISORDER",
        "PUBLIC_SAFETY_THREAT"
    ]

    @classmethod
    def evaluate_authorization(
        cls,
        operation_name: str,
        statutory_ground: str,
        offense_severity: str,
        less_intrusive_methods_exhausted: bool,
        bystander_masking_active: bool,
        duration_hours: int
    ) -> Dict[str, Any]:
        passed_checks = []
        violations = []

        # 1. Statutory Ground Check
        if statutory_ground in cls.STATUTORY_GROUNDS:
            passed_checks.append("RIPA Sec 22(2) Statutory Ground Valid")
        else:
            violations.append("Invalid or unverified statutory ground for communications acquisition")

        # 2. Necessity Check
        if less_intrusive_methods_exhausted:
            passed_checks.append("Necessity Principle Satisfied: Less intrusive means exhausted")
        else:
            violations.append("Necessity Failed: Must exhaust overt inquiries before deploying cell-site simulator")

        # 3. Proportionality Check
        if offense_severity in ("HIGH", "CRITICAL", "INDICTABLE_SERIOUS_OFFENSE"):
            passed_checks.append("Proportionality Satisfied: Serious offense gravity justifies intrusion")
        else:
            violations.append("Proportionality Failed: Non-serious infraction does not warrant covert RF capture")

        # 4. Collateral Intrusion Mitigation
        if bystander_masking_active and duration_hours <= 72:
            passed_checks.append("Collateral Intrusion Safeguards Compliant: Hashing + 72-hour auto-purge")
        else:
            violations.append("Collateral Intrusion Breach: Deployment exceeds 72h or lacks bystander anonymisation")

        is_authorized = len(violations) == 0
        return {
            "operation_name": operation_name,
            "statutory_framework": "Regulation of Investigatory Powers Act 2000 (RIPA) / Investigatory Powers Act 2016",
            "is_ripa_compliant": is_authorized,
            "decision": "AUTHORIZATION_CONFIRMED" if is_authorized else "AUTHORIZATION_DENIED",
            "compliance_score": round((len(passed_checks) / 4.0) * 100.0, 1),
            "passed_checks": passed_checks,
            "violations": violations,
            "ipco_oversight_notes": "Subject to annual audit by Investigatory Powers Commissioner's Office (IPCO)",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
