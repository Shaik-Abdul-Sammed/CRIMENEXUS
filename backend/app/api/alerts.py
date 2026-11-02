from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.alert import Alert

router = APIRouter(prefix="/alerts", tags=["Threat Alerts & Intercepts"])


@router.get("")
@router.get("/")
def list_alerts(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    alerts = db.query(Alert).offset(skip).limit(limit).all()
    if not alerts:
        return [
            {
                "id": "ALT-SMURF-01",
                "title": "Smurfing Detection: Structured Cash Transfers",
                "beneficiary": "ACC-HAWALA-MULE-902",
                "beneficiary_account": "ACC-HAWALA-MULE-902",
                "senders_count": 5,
                "total_amount": 247500,
                "severity": "CRITICAL",
                "timestamp": "10 mins ago"
            },
            {
                "id": "ALT-SMURF-02",
                "title": "Mule Inflow Spike Under 50k",
                "beneficiary": "ACC-MULE-DELHI-441",
                "beneficiary_account": "ACC-MULE-DELHI-441",
                "senders_count": 4,
                "total_amount": 199996,
                "severity": "HIGH",
                "timestamp": "42 mins ago"
            }
        ]
    return alerts
