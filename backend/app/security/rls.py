"""
Multi-Tenant Row-Level Security (RLS) for CRIMENEXUS.

Enforces jurisdictional isolation:
- Station level (IO / SHO): Can only access records from their assigned police station.
- District level (SP / DSP): Can access records within their district.
- State / Federal level (CID / DGP / CBI / Super Admin): Can access multi-jurisdictional records.
"""

from typing import Optional, List, Any
from enum import Enum
from pydantic import BaseModel
from fastapi import HTTPException, status
from sqlalchemy.orm import Query


class JurisdictionalLevel(str, Enum):
    STATION = "STATION"
    DISTRICT = "DISTRICT"
    STATE = "STATE"
    NATIONAL = "NATIONAL"


class OfficerRole(str, Enum):
    IO = "IO"                     # Investigating Officer
    SHO = "SHO"                   # Station House Officer
    DSP = "DSP"                   # Deputy Superintendent of Police (Sub-division)
    SP = "SP"                     # Superintendent of Police (District)
    CID = "CID"                   # Criminal Investigation Department (State)
    DGP = "DGP"                   # Director General of Police (State-wide)
    CBI = "CBI"                   # Central Bureau of Investigation (National)
    SUPER_ADMIN = "SUPER_ADMIN"


class TenancyContext(BaseModel):
    user_id: str
    role: OfficerRole
    station_id: Optional[str] = None
    district_id: Optional[str] = None
    state_id: Optional[str] = None

    def get_jurisdiction_level(self) -> JurisdictionalLevel:
        if self.role in [OfficerRole.SUPER_ADMIN, OfficerRole.CBI]:
            return JurisdictionalLevel.NATIONAL
        elif self.role in [OfficerRole.DGP, OfficerRole.CID]:
            return JurisdictionalLevel.STATE
        elif self.role in [OfficerRole.SP, OfficerRole.DSP]:
            return JurisdictionalLevel.DISTRICT
        else:
            return JurisdictionalLevel.STATION


def check_record_access(
    record_station_id: Optional[str],
    record_district_id: Optional[str],
    record_state_id: Optional[str],
    context: TenancyContext,
    shared_stations: Optional[List[str]] = None
) -> bool:
    """
    Evaluates whether an officer with context can access a record from a given jurisdiction.
    """
    level = context.get_jurisdiction_level()
    
    # National / State CID oversight
    if level == JurisdictionalLevel.NATIONAL:
        return True
    
    if level == JurisdictionalLevel.STATE:
        if context.state_id and record_state_id:
            return context.state_id.lower() == record_state_id.lower()
        return True  # If state is unconstrained, State-level has access
    
    if level == JurisdictionalLevel.DISTRICT:
        if context.district_id and record_district_id:
            return context.district_id.lower() == record_district_id.lower()
        return False
        
    # Station-level (IO / SHO)
    if shared_stations and context.station_id in shared_stations:
        return True
        
    if context.station_id and record_station_id:
        return context.station_id.lower() == record_station_id.lower()
        
    return False


def enforce_tenancy(
    record_station_id: Optional[str],
    record_district_id: Optional[str],
    record_state_id: Optional[str],
    context: TenancyContext,
    shared_stations: Optional[List[str]] = None
):
    """
    Raises 403 Forbidden if the officer lacks jurisdictional clearance for the record.
    """
    if not check_record_access(record_station_id, record_district_id, record_state_id, context, shared_stations):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Jurisdictional access denied under RLS policy. Officer role '{context.role.value}' at "
                f"station '{context.station_id}' cannot view case data of station '{record_station_id}' "
                f"without CID or SP level escalation."
            )
        )


def apply_rls_filter(query: Query, model: Any, context: TenancyContext) -> Query:
    """
    Applies SQLAlchemy WHERE clauses enforcing row-level security based on officer context.
    """
    level = context.get_jurisdiction_level()
    
    if level == JurisdictionalLevel.NATIONAL:
        return query
        
    if level == JurisdictionalLevel.STATE and context.state_id:
        if hasattr(model, "state_id"):
            return query.filter(model.state_id == context.state_id)
        return query
        
    if level == JurisdictionalLevel.DISTRICT and context.district_id:
        if hasattr(model, "district_id"):
            return query.filter(model.district_id == context.district_id)
        return query
        
    if level == JurisdictionalLevel.STATION and context.station_id:
        if hasattr(model, "station_id"):
            return query.filter(model.station_id == context.station_id)
            
    return query
