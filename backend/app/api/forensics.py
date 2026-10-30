import logging
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.services.forensics.cdr_parser import parse_telecom_cdr_csv
from app.services.forensics.bank_parser import parse_bank_statement_csv
from app.services.forensics.nlp_extractor import ingest_and_parse_fir, extract_entities_from_police_narrative

logger = logging.getLogger("crimenexus.api.forensics")

router = APIRouter(tags=["Forensics & Evidence Extraction"])


class FIRExtractRequest(BaseModel):
    case_number: str
    title: str
    narrative_text: str
    filed_by: str = "Inspector In-Charge"


class RawCSVRequest(BaseModel):
    csv_content: str
    account_number: Optional[str] = "ACC-SUSPECT-01"
    account_holder_name: Optional[str] = "Primary Suspect"


@router.post("/forensics/cdr/upload", summary="Parse and ingest telecom CDR records (Airtel, Jio, Vi, BSNL)")
async def upload_cdr_records(
    file: Optional[UploadFile] = File(None),
    raw_csv: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Ingests and parses telecom Call Detail Records (CDR), identifies SIM-swapping,
    maps geolocations against known cell towers, and writes to relational and graph databases.
    """
    content = ""
    if file:
        content_bytes = await file.read()
        content = content_bytes.decode("utf-8", errors="replace")
    elif raw_csv:
        content = raw_csv
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'file' or 'raw_csv' must be provided."
        )

    try:
        result = parse_telecom_cdr_csv(content, db)
        return result
    except Exception as exc:
        logger.error("CDR parsing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process CDR records: {str(exc)}"
        )


@router.post("/forensics/bank/upload", summary="Parse bank statements, detect smurfing/structuring, and link accounts")
async def upload_bank_statement(
    file: Optional[UploadFile] = File(None),
    account_number: str = Form("ACC-SUSPECT-01"),
    account_holder_name: str = Form("Primary Suspect"),
    raw_csv: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Parses unstructured bank transactions (UPI, NEFT, RTGS, IMPS), detects structuring/smurfing under ₹50k,
    and constructs money trail networks in Neo4j.
    """
    content = ""
    if file:
        content_bytes = await file.read()
        content = content_bytes.decode("utf-8", errors="replace")
    elif raw_csv:
        content = raw_csv
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'file' or 'raw_csv' must be provided."
        )

    try:
        result = parse_bank_statement_csv(content, account_number, account_holder_name, db)
        return result
    except Exception as exc:
        logger.error("Bank statement parsing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process bank statement: {str(exc)}"
        )


@router.post("/forensics/fir/extract", summary="Extract entities and IPC/BNS sections from police FIR / statements")
def extract_fir_entities(payload: FIRExtractRequest, db: Session = Depends(get_db)):
    """
    Extracts legal sections (IPC/BNS), suspects, vehicle numbers, phone numbers,
    and crime classification from an FIR narrative, creating corresponding graph nodes and relationships.
    """
    try:
        result = ingest_and_parse_fir(
            case_number=payload.case_number,
            title=payload.title,
            narrative_text=payload.narrative_text,
            filed_by=payload.filed_by,
            db=db
        )
        return result
    except Exception as exc:
        logger.error("FIR extraction error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process FIR report: {str(exc)}"
        )


@router.post("/forensics/nlp/preview", summary="Preview NLP extraction without writing to database")
def preview_nlp_extraction(payload: dict):
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Missing 'text' in payload.")
    return extract_entities_from_police_narrative(text)
