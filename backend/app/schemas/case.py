from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class CaseBase(BaseModel):
    case_number: str
    title: str
    description: Optional[str] = None
    status: str = "OPEN"
    priority: str = "MEDIUM"


class CaseCreate(CaseBase):
    lead_officer_id: Optional[int] = None
    agency_id: Optional[int] = None


class CaseResponse(CaseBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
