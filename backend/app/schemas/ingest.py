import re
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class BankTransactionIngest(BaseModel):
    transaction_id: Optional[str] = None
    sender_name: str
    sender_account: str
    receiver_name: str
    receiver_account: str
    amount: float = Field(..., gt=0)
    currency: str = "INR"
    transaction_type: str = "WIRE_TRANSFER"
    suspicious: Optional[bool] = None
    notes: Optional[str] = None
    timestamp: Optional[datetime] = None
    date: Optional[datetime] = None


class CallRecordIngest(BaseModel):
    record_id: Optional[str] = None
    caller_number: str
    receiver_number: str
    caller_name: Optional[str] = None
    receiver_name: Optional[str] = None
    duration_seconds: int = 60
    tower_id: Optional[str] = "CELL-TOWER-01"
    location_name: Optional[str] = "Sector 62, Noida"
    call_type: str = "VOICE"

    @field_validator("caller_number", "receiver_number")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Phone number cannot be empty")
        # Remove formatting spaces, hyphens, parentheses
        cleaned = re.sub(r"[\s\-\(\)]", "", v.strip())
        return cleaned


class VehicleSightingIngest(BaseModel):
    sighting_id: Optional[str] = None
    plate_number: str
    vehicle_model: Optional[str] = "Toyota Fortuner"
    owner_name: Optional[str] = None
    camera_id: str = "CAM-ANPR-01"
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    speed_kmh: Optional[float] = 55.0
    confidence: Optional[float] = 0.95
    source_type: str = "ANPR"


class PoliceReportIngest(BaseModel):
    report_number: Optional[str] = None
    report_type: str = "FIR"  # FIR or WITNESS_STATEMENT
    case_number: str
    title: str
    content: str = Field(..., min_length=1)
    filed_by: str = "Inspector Rajesh Varma"
    witness_or_complainant: Optional[str] = None
    suspects_mentioned: Optional[str] = None
    entities: Optional[list] = None
