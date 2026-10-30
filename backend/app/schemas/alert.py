from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class AlertBase(BaseModel):
    title: str
    description: str
    severity: str = "HIGH"  # CRITICAL, HIGH, MEDIUM, LOW
    source: str = "AI_ANALYTICS"
    status: str = "ACTIVE"


class AlertCreate(AlertBase):
    case_id: Optional[int] = None
    target_identifier: Optional[str] = None


class AlertResponse(AlertBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
