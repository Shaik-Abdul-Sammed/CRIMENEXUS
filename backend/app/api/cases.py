from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.case import Case

router = APIRouter(prefix="/cases", tags=["Case Management"])


class CaseCreate(BaseModel):
    case_number: str
    title: str
    crime_type: Optional[str] = "Organized Crime"
    description: Optional[str] = None
    location: Optional[str] = None
    risk_level: Optional[str] = "medium"


class CaseResponse(BaseModel):
    id: int
    case_number: str
    title: str
    crime_type: Optional[str]
    description: Optional[str]
    location: Optional[str]
    status: str
    risk_level: str

    class Config:
        from_attributes = True


@router.get("/", response_model=List[CaseResponse])
def list_cases(db: Session = Depends(get_db)):
    """Returns all police cases."""
    return db.query(Case).all()


@router.post("/", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(case_data: CaseCreate, db: Session = Depends(get_db)):
    """Creates a new criminal investigation case."""
    existing = db.query(Case).filter(Case.case_number == case_data.case_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Case number already exists")

    new_case = Case(
        case_number=case_data.case_number,
        title=case_data.title,
        crime_type=case_data.crime_type,
        description=case_data.description,
        location=case_data.location,
        status="active",
        risk_level=case_data.risk_level
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
