import json
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Request, UploadFile, File
from pydantic import BaseModel, Field
from app.ml_service.intercept_translator import get_intercept_translator
from app.database.postgres import SessionLocal
from app.models.audit_ledger import AuditLedgerEntry

logger = logging.getLogger("crimenexus.intercept_translate")

router = APIRouter(tags=["Real-Time Intercept Translation"])

class TranslateRequest(BaseModel):
    transcript: Optional[str] = None
    original_transcript: Optional[str] = None
    source_language: Optional[str] = "HINDI_URDU"
    case_id: Optional[str] = "FIR-2026-INTERCEPT"
    intercept_id: Optional[str] = None
    target_identifier: Optional[str] = None

@router.get("/intercept-translate/health", summary="Intercept Translation Health Check")
@router.get("/intercept/health", summary="Intercept Health Check")
def intercept_health():
    translator = get_intercept_translator()
    return {
        "status": "healthy",
        "service": "Lawful Intercept Multilingual Translation & Criminal Argot Decoder",
        "languages_supported": ["Hindi", "Urdu", "Punjabi", "Bhojpuri", "Bengali", "Bambaiya Slang"],
        "model_engine": translator.engine,
        "engine": translator.engine,
        "version": "1.0.0"
    }

@router.get("/intercept/slang-glossary", summary="Get Underworld Code-Word / Argot Dictionary")
def get_slang_glossary():
    translator = get_intercept_translator()
    return translator.ARGOT_GLOSSARY

@router.post("/intercept/translate", summary="Translate Intercept & Decode Criminal Argot")
@router.post("/intercept-translate/translate", summary="Translate Intercept & Decode Criminal Argot")
def translate_intercept(payload: TranslateRequest):
    translator = get_intercept_translator()

    raw_text = payload.transcript or payload.original_transcript
    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Transcript text cannot be empty. No intercept audio uploaded — upload audio to transcribe."
        )

    res = translator.decode_and_translate(
        transcript=raw_text.strip(),
        source_language=payload.source_language or "HINDI_URDU"
    )
    res["english_translation"] = res.get("translated_transcript")
    res["urgent_threat_level"] = "HIGH" if res.get("extracted_entities", {}).get("urgency_markers") else "MEDIUM"
    res["detected_language"] = payload.source_language or "auto"

    # Persist translation log to PostgreSQL AuditLedgerEntry
    try:
        db = SessionLocal()
        try:
            import hashlib
            raw_hash = hashlib.sha256(f"{payload.case_id}|{raw_text[:30]}|{datetime.utcnow().isoformat()}".encode()).hexdigest()
            entry = AuditLedgerEntry(
                officer_badge="INTERCEPT-TRANSLATOR",
                officer_name="Official Linguistic Intelligence Analyst",
                station_id="TELECOM_INTERCEPT_WING",
                action="ARGOT_TRANSLATION_COMPLETED",
                resource_type="LAWFUL_INTERCEPT",
                resource_id=payload.case_id or "INTERCEPT-RECORD",
                details=json.dumps(res),
                previous_hash="0"*64,
                current_hash=raw_hash
            )
            db.add(entry)
            db.commit()
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Error persisting translation audit record: %s", exc)

    return res

@router.post("/intercept/translate-audio", summary="Transcribe & Translate Intercept Audio")
@router.post("/intercept-translate/audio", summary="Transcribe & Translate Intercept Audio")
def translate_intercept_audio(audio: UploadFile = File(...)):
    translator = get_intercept_translator()
    audio_bytes = audio.file.read()
    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio file too small")
    if len(audio_bytes) > 25_000_000:
        raise HTTPException(status_code=413, detail="Audio file exceeds 25MB")

    result = translator.translate_audio(audio_bytes)

    try:
        db = SessionLocal()
        try:
            import hashlib
            raw_hash = hashlib.sha256(f"AUDIO_INTERCEPT|{datetime.utcnow().isoformat()}".encode()).hexdigest()
            entry = AuditLedgerEntry(
                officer_badge="INTERCEPT-WHISPER",
                officer_name="Linguistic Speech Analyst",
                station_id="TELECOM_INTERCEPT_WING",
                action="INTERCEPT_TRANSLATE",
                resource_type="LAWFUL_INTERCEPT_AUDIO",
                resource_id="AUDIO-STREAM-01",
                details=json.dumps({"engine": result.get("engine", "whisper"), "transcript": result.get("transcript_original", "")}),
                previous_hash="0"*64,
                current_hash=raw_hash
            )
            db.add(entry)
            db.commit()
        finally:
            db.close()
    except Exception as audit_err:
        logger.warning("Audit log error for audio translate: %s", audit_err)

    return result
    res["english_translation"] = res.get("translated_transcript")
    res["urgent_threat_level"] = "HIGH" if res.get("extracted_entities", {}).get("urgency_markers") else "MEDIUM"
    res["detected_language"] = payload.source_language or "auto"

    # Persist translation log to PostgreSQL AuditLedgerEntry
    try:
        db = SessionLocal()
        try:
            import hashlib
            raw_hash = hashlib.sha256(f"{payload.case_id}|{raw_text[:30]}|{datetime.utcnow().isoformat()}".encode()).hexdigest()
            entry = AuditLedgerEntry(
                officer_badge="INTERCEPT-TRANSLATOR",
                officer_name="Official Linguistic Intelligence Analyst",
                station_id="TELECOM_INTERCEPT_WING",
                action="ARGOT_TRANSLATION_COMPLETED",
                resource_type="LAWFUL_INTERCEPT",
                resource_id=payload.case_id or "INTERCEPT-RECORD",
                details=json.dumps(res),
                previous_hash="0"*64,
                current_hash=raw_hash
            )
            db.add(entry)
            db.commit()
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Error persisting translation audit record: %s", exc)

    return res

@router.get("/intercept/audio-transcript", summary="Get Latest Intercept Audio Transcript from Database")
@router.get("/intercept/benchmark-audio-transcript", summary="Get Latest Intercept Audio Transcript from Database")
def get_latest_audio_transcript():
    """Queries latest transcribed lawful intercept audio from the PostgreSQL database."""
    db = SessionLocal()
    try:
        entry = db.query(AuditLedgerEntry).filter(
            AuditLedgerEntry.resource_type == "LAWFUL_INTERCEPT"
        ).order_by(AuditLedgerEntry.timestamp.desc()).first()

        if entry and entry.details:
            try:
                return json.loads(entry.details)
            except Exception:
                pass

        return {
            "status": "AWAITING_INPUT",
            "message": "No intercept audio uploaded — upload audio to transcribe",
            "original_transcript": "",
            "translated_transcript": "",
            "detected_slang": []
        }
    finally:
        db.close()
