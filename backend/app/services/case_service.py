from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.case import Case
from app.schemas.case import CaseCreate


def get_all_cases(db: Session, skip: int = 0, limit: int = 100) -> List[Case]:
    return db.query(Case).offset(skip).limit(limit).all()


def get_case_by_number(db: Session, case_number: str) -> Optional[Case]:
    return db.query(Case).filter(Case.case_number == case_number).first()


def create_case(db: Session, case_in: CaseCreate) -> Case:
    case_obj = Case(
        case_number=case_in.case_number,
        title=case_in.title,
        description=case_in.description,
        status=case_in.status,
        priority=case_in.priority,
        lead_officer_id=case_in.lead_officer_id,
        agency_id=case_in.agency_id
    )
    db.add(case_obj)
    db.commit()
    db.refresh(case_obj)
    return case_obj
