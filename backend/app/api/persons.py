from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.person import Person

router = APIRouter(prefix="/persons", tags=["Persons & Suspects"])


@router.get("/")
def get_persons(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    persons = db.query(Person).offset(skip).limit(limit).all()
    return persons


@router.get("/{person_id}")
def get_person(person_id: int, db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person
