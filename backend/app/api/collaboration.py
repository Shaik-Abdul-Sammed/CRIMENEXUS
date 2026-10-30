from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.services.collaboration_service import list_cross_agency_cases

router = APIRouter(prefix="/collaboration", tags=["Inter-Agency Collaboration"])


@router.get("/cases")
def get_shared_cases(db: Session = Depends(get_db)):
    return list_cross_agency_cases(db)
