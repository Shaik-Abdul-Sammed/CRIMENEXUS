from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.report import PoliceReport

router = APIRouter(prefix="/reports", tags=["Police Reports & FIRs"])


@router.get("/")
def list_reports(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    reports = db.query(PoliceReport).offset(skip).limit(limit).all()
    return reports
