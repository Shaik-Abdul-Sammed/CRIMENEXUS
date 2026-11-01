from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Police Personnel & Users"])


@router.get("/")
def list_users(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return [
        {
            "id": u.id,
            "badge_number": u.badge_number,
            "full_name": u.full_name,
            "rank": u.rank,
            "station_id": u.station_id,
            "is_active": u.is_active
        }
        for u in users
    ]
