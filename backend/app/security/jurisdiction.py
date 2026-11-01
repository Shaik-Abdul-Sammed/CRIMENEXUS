import logging
from fastapi import HTTPException, status
from pydantic import BaseModel

logger = logging.getLogger("crimenexus.security.jurisdiction")

# Hierarchy of Police Department Roles
POLICE_ROLES = {
    "CONSTABLE": {"level": 1, "can_approve_warrants": False, "statewide": False},
    "SUB_INSPECTOR": {"level": 2, "can_approve_warrants": False, "statewide": False},
    "INSPECTOR_IO": {"level": 3, "can_approve_warrants": False, "statewide": False},  # Investigating Officer
    "DSP_SUPERVISOR": {"level": 4, "can_approve_warrants": True, "statewide": False},
    "SP_CHIEF": {"level": 5, "can_approve_warrants": True, "statewide": True},        # Superintendent of Police
    "STATE_ADMIN": {"level": 6, "can_approve_warrants": True, "statewide": True}       # State Cyber Command
}


class OfficerIdentity(BaseModel):
    badge_number: str
    name: str
    station_id: str
    district: str
    role: str = "INSPECTOR_IO"


def verify_jurisdiction_access(
    officer: OfficerIdentity,
    case_station_id: str,
    case_is_interagency: bool = False
) -> bool:
    """
    Validates whether an officer can access or modify a case based on police territorial jurisdiction.
    1. Statewide administrators or District SPs have universal access.
    2. Officers assigned to the specific station have direct access.
    3. Inter-agency or multi-district cases permit cross-station read/write.
    """
    role_info = POLICE_ROLES.get(officer.role.upper(), {"level": 1, "statewide": False})

    # Statewide clearance
    if role_info.get("statewide", False):
        return True

    # Same police station
    if officer.station_id == case_station_id:
        return True

    # Inter-agency multi-station task force
    if case_is_interagency:
        return True

    logger.warning("Access denied: Officer %s (Station %s) attempted to access Case from Station %s",
                   officer.badge_number, officer.station_id, case_station_id)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Jurisdictional Restriction: Officer from '{officer.station_id}' cannot access records belonging to '{case_station_id}' without inter-agency transfer."
    )


def can_authorize_high_impact_actions(role: str) -> bool:
    """
    Determines if an officer holds sufficient supervisory rank (DSP, ACP, SP, or State Admin)
    to authorize Bank Freezes, Telecommunications Interception, or Surveillance Warrants.
    """
    role_info = POLICE_ROLES.get(role.upper(), {})
    return role_info.get("can_approve_warrants", False)
