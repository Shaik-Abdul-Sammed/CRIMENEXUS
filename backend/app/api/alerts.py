from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.alert import Alert

router = APIRouter(prefix="/alerts", tags=["Threat Alerts & Intercepts"])


@router.get("/")
def list_alerts(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    alerts = db.query(Alert).offset(skip).limit(limit).all()
    return alerts
