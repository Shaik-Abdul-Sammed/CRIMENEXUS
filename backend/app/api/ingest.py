from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.schemas.ingest import (
    BankTransactionIngest,
    CallRecordIngest,
    VehicleSightingIngest,
    PoliceReportIngest
)
from app.services.ingestion import (
    ingest_bank_transaction,
    ingest_call_record,
    ingest_vehicle_sighting,
    ingest_police_report
)

router = APIRouter(prefix="/ingest", tags=["Multi-Source Ingestion & Dual-Write"])


@router.post("/bank", status_code=status.HTTP_201_CREATED)
def ingest_bank(data: BankTransactionIngest, db: Session = Depends(get_db)):
    """
    Dual-writes a bank transaction to PostgreSQL and Neo4j graph.
    Creates Sender, Receiver, Account nodes, and money transfer edges.
    """
    result = ingest_bank_transaction(data.dict(), db)
    return result


@router.post("/cdr", status_code=status.HTTP_201_CREATED)
def ingest_cdr(data: CallRecordIngest, db: Session = Depends(get_db)):
    """
    Dual-writes Call Detail Records (CDR) to PostgreSQL and Neo4j graph.
    Creates Person, Phone nodes, and call event edges.
    """
    result = ingest_call_record(data.dict(), db)
    return result


@router.post("/vehicle", status_code=status.HTTP_201_CREATED)
def ingest_vehicle(data: VehicleSightingIngest, db: Session = Depends(get_db)):
    """
    Dual-writes ANPR / CCTV vehicle sightings to PostgreSQL and Neo4j.
    Creates Vehicle, Location nodes, and sighting edges.
    """
    result = ingest_vehicle_sighting(data.dict(), db)
    return result


@router.post("/report", status_code=status.HTTP_201_CREATED)
def ingest_report(data: PoliceReportIngest, db: Session = Depends(get_db)):
    """
    Dual-writes FIR and Witness statements to PostgreSQL and Neo4j.
    Creates Case, Witness, Suspect nodes, and association edges.
    """
    result = ingest_police_report(data.dict(), db)
    return result
