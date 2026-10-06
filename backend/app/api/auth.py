from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import create_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=UserResponse
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    user = create_user(db, user_data)

    if user is None:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return user
