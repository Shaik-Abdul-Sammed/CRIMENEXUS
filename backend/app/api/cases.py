from typing import List, Optional
import io
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.case import Case
from app.services.legal.dossier_generator import generate_court_ready_dossier_pdf

router = APIRouter(prefix="/cases", tags=["Case Management"])


class CaseCreate(BaseModel):
    case_number: str
    title: str
    crime_type: Optional[str] = "Organized Crime"
    description: Optional[str] = None
    location: Optional[str] = None
    risk_level: Optional[str] = "medium"


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_number: str
    title: str
    crime_type: Optional[str]
    description: Optional[str]
    location: Optional[str]
    status: str
    risk_level: str


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


@router.get("/export/dossier-pdf")
def export_dossier_pdf(
    case_number: str = Query("FIR-2026-CRIME-890", description="FIR or Case Number"),
    title: Optional[str] = Query(None, description="Case Title / Subject"),
    io_name: str = Query("Inspector V. K. Sharma (Special Cell)", description="Investigating Officer"),
    police_station: str = Query("Cyber Crime Police Station, Sector 20", description="Police Station"),
    db: Session = Depends(get_db)
):
    """
    Generates a formal, court-admissible forensic case dossier PDF compliant with
    Section 63 of Bharatiya Sakshya Adhiniyam 2023 / Section 65B Indian Evidence Act.
    """
    case = db.query(Case).filter(Case.case_number == case_number).first()
    case_title = title or (case.title if case else "Illicit Hawala Financial Network & Extortion Syndicate")
    
    pdf_bytes = generate_court_ready_dossier_pdf(
        case_number=case_number,
        case_title=case_title,
        io_name=io_name,
        police_station=police_station
    )
    
    clean_num = case_number.replace("/", "_").replace(" ", "_")
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Court_Ready_Dossier_{clean_num}.pdf",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case
