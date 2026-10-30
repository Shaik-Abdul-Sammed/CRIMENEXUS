import bleach
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

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # Strict 10MB limit to prevent Graph/Memory DoS


def sanitize_input_text(text: Optional[str]) -> str:
    """Sanitizes user/police input text using bleach to eliminate stored XSS risks."""
    if not text:
        return ""
    # Strip HTML tags and dangerous attributes
    return bleach.clean(text.strip(), tags=[], strip=True)


async def validate_and_read_upload(file: UploadFile) -> str:
    """Enforces 10MB file limit and reads UTF-8 content securely."""
    content_bytes = await file.read()
    if len(content_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds strict maximum allowable limit of 10MB (size: {len(content_bytes):,} bytes)."
        )
    return content_bytes.decode("utf-8", errors="replace")


def extract_text_from_file_bytes(content_bytes: bytes, filename: str = "") -> str:
    """
    Extracts text from uploaded PDF or plain text files.
    Uses PyMuPDF (fitz) for PDF documents, falling back to UTF-8 decoding.
    """
    if len(content_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds strict maximum allowable limit of 10MB (size: {len(content_bytes):,} bytes)."
        )

    if filename.lower().endswith(".pdf") or content_bytes.startswith(b"%PDF"):
        try:
            import fitz
            doc = fitz.open(stream=content_bytes, filetype="pdf")
            text_pages = [page.get_text() for page in doc]
            return "\n".join(text_pages)
        except Exception as exc:
            logger.warning("PDF extraction failed, falling back to text decode: %s", exc)

    return content_bytes.decode("utf-8", errors="replace")


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
        content = await validate_and_read_upload(file)
    elif raw_csv:
        if len(raw_csv.encode("utf-8")) > MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="Payload exceeds maximum 10MB limit.")
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
        content = await validate_and_read_upload(file)
    elif raw_csv:
        if len(raw_csv.encode("utf-8")) > MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="Payload exceeds maximum 10MB limit.")
        content = raw_csv
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'file' or 'raw_csv' must be provided."
        )

    safe_acc_holder = sanitize_input_text(account_holder_name)
    safe_acc_number = sanitize_input_text(account_number)

    try:
        result = parse_bank_statement_csv(content, safe_acc_holder, safe_acc_number, db)
        return result
    except Exception as exc:
        logger.error("Bank statement parsing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process bank statement: {str(exc)}"
        )


@router.post("/forensics/fir/extract", summary="Extract entities and IPC/BNS sections from police FIR / statements (JSON)")
def extract_fir_entities(payload: FIRExtractRequest, db: Session = Depends(get_db)):
    """
    Extracts legal sections (IPC/BNS), suspects, vehicle numbers, phone numbers,
    and crime classification from an FIR narrative, creating corresponding graph nodes and relationships.
    """
    clean_case_number = sanitize_input_text(payload.case_number)
    clean_title = sanitize_input_text(payload.title)
    clean_narrative = sanitize_input_text(payload.narrative_text)
    clean_filed_by = sanitize_input_text(payload.filed_by)

    try:
        result = ingest_and_parse_fir(
            case_number=clean_case_number,
            title=clean_title,
            narrative_text=clean_narrative,
            filed_by=clean_filed_by,
            db=db
        )
        return result
    except Exception as exc:
        logger.error("FIR extraction error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process FIR report: {str(exc)}"
        )


@router.post("/forensics/fir/upload", summary="Upload text/PDF FIR document with automated zero-click entity linkage")
async def upload_fir_document(
    file: Optional[UploadFile] = File(None),
    case_number: str = Form("CASE-2026-FIR-01"),
    title: str = Form("First Information Report"),
    narrative_text: Optional[str] = Form(None),
    filed_by: str = Form("Inspector In-Charge"),
    db: Session = Depends(get_db)
):
    """
    Zero-Click FIR Ingestion: Accepts text or PDF FIR files, extracts forensic entities
    (IPC sections, suspects, phones, vehicle registration numbers), writes to PostgreSQL,
    and automatically merges/links them into Neo4j graph networks.
    """
    raw_content = ""
    if file:
        file_bytes = await file.read()
        raw_content = extract_text_from_file_bytes(file_bytes, file.filename or "")
    elif narrative_text:
        raw_content = narrative_text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a 'file' (PDF or text) or 'narrative_text' must be provided."
        )

    clean_case_number = sanitize_input_text(case_number)
    clean_title = sanitize_input_text(title)
    clean_narrative = sanitize_input_text(raw_content)
    clean_filed_by = sanitize_input_text(filed_by)

    try:
        result = ingest_and_parse_fir(
            case_number=clean_case_number,
            title=clean_title,
            narrative_text=clean_narrative,
            filed_by=clean_filed_by,
            db=db
        )
        return result
    except Exception as exc:
        logger.error("FIR upload processing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process uploaded FIR: {str(exc)}"
        )


@router.post("/forensics/nlp/preview", summary="Preview NLP extraction without writing to database")
def preview_nlp_extraction(payload: dict):
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Missing 'text' in payload.")
    return extract_entities_from_police_narrative(text)
