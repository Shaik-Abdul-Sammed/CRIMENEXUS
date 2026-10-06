from fastapi import FastAPI

from app.database.postgres import engine, Base

from app.models.user import User
from app.models.agency import Agency
from app.models.case import Case
from app.models.person import Person
from app.models.location import Location
from app.models.relationship import Relationship
from app.models.alert import Alert

from app.api.auth import router as auth_router

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="CrimeNexus API",
    description="AI-based Crime Network Analysis Backend",
    version="1.0.0"
)


app.include_router(auth_router)

@app.get("/")
def root():
    return {
        "message": "CrimeNexus Backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
