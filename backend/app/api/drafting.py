import bleach
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel

from app.ml_service.rag_engine import get_rag_engine

logger = logging.getLogger("crimenexus.api.drafting")

router = APIRouter(prefix="/draft", tags=["AI Legal Drafting & Generative RAG"])


def sanitize(text: Optional[str]) -> str:
    if not text:
        return ""
    return bleach.clean(text.strip(), tags=[], strip=True)


class DraftFIRRequest(BaseModel):
    narrative: str
    complainant_name: Optional[str] = None


class DraftChargeSheetRequest(BaseModel):
    accused_name: Optional[str] = None
    acts_sections: Optional[str] = None


class DraftBankNoticeRequest(BaseModel):
    bank_name: Optional[str] = "State Bank of India"
    ifsc_code: Optional[str] = "SBIN0001244"
    branch_name: Optional[str] = "Parliament Street Main Branch"
    amount: Optional[str] = "Entire Credit Balance"
    reason: Optional[str] = "Smurfing / Structuring deposits under Section 102 CrPC"


class DraftLOCRequest(BaseModel):
    identification: Optional[str] = "Aadhaar / Passport under verification"


@router.post("/fir", summary="AI-RAG Automated Drafting of formal Police FIR")
def draft_fir_endpoint(payload: DraftFIRRequest):
    clean_narrative = sanitize(payload.narrative)
    if not clean_narrative:
        raise HTTPException(status_code=400, detail="Narrative text is required to draft an FIR.")
    engine = get_rag_engine()
    return engine.draft_fir(clean_narrative)


@router.post("/charge-sheet/{case_id}", summary="AI-RAG Automated Drafting of Court Charge Sheet")
def draft_charge_sheet_endpoint(
    case_id: str = Path(..., description="Target Case or FIR ID"),
    payload: Optional[DraftChargeSheetRequest] = None
):
    clean_case_id = sanitize(case_id)
    accused = sanitize(payload.accused_name) if payload and payload.accused_name else None
    engine = get_rag_engine()
    return engine.draft_charge_sheet(case_id=clean_case_id, accused_name=accused)


@router.post("/bank-notice/{account}", summary="Draft Section 102 CrPC / Sec 106 BNSS Bank Freeze Notice")
def draft_bank_freeze_notice_endpoint(
    account: str = Path(..., description="Target Beneficiary / Smurfing Account Number"),
    payload: Optional[DraftBankNoticeRequest] = None
):
    clean_acc = sanitize(account)
    bank = sanitize(payload.bank_name) if payload and payload.bank_name else "State Bank of India"
    ifsc = sanitize(payload.ifsc_code) if payload and payload.ifsc_code else "SBIN0001244"
    branch = sanitize(payload.branch_name) if payload and payload.branch_name else "Parliament Street Main Branch"
    amount = sanitize(payload.amount) if payload and payload.amount else "Entire Credit Balance"
    reason = sanitize(payload.reason) if payload and payload.reason else "Smurfing / Structuring deposits under Section 102 CrPC"
    engine = get_rag_engine()
    return engine.draft_bank_freeze_notice(
        account_number=clean_acc,
        bank_name=bank,
        ifsc_code=ifsc,
        branch_name=branch,
        amount=amount,
        reason=reason
    )


@router.post("/lookout-circular/{suspect}", summary="Draft Ministry of Home Affairs Lookout Circular (LOC)")
def draft_lookout_circular_endpoint(
    suspect: str = Path(..., description="Fugitive Suspect Name"),
    payload: Optional[DraftLOCRequest] = None
):
    clean_suspect = sanitize(suspect)
    ident = sanitize(payload.identification) if payload and payload.identification else None
    engine = get_rag_engine()
    return engine.draft_lookout_circular(suspect_name=clean_suspect, passport_or_id=ident)
