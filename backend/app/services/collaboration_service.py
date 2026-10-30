from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.case import Case


def list_cross_agency_cases(db: Session) -> List[Dict[str, Any]]:
    cases = db.query(Case).all()
    return [
        {
            "case_id": c.id,
            "case_number": c.case_number,
            "title": c.title,
            "status": c.status,
            "priority": c.priority,
            "agency_id": c.agency_id
        }
        for c in cases
    ]
