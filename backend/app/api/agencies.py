from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.agency import Agency

router = APIRouter(prefix="/agencies", tags=["Law Enforcement Agencies"])


@router.get("/")
def list_agencies(db: Session = Depends(get_db)):
    agencies = db.query(Agency).all()
    return agencies
