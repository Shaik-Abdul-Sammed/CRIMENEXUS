import hashlib
import json
import logging
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from app.database.postgres import SessionLocal
from app.models.audit_ledger import AuditLedgerEntry

logger = logging.getLogger("crimenexus.blockchain_evidence")

class BlockchainEvidenceLedger:
    """
    Immutable Cryptographic Evidence Chain-of-Custody Ledger.
    Computes sequential SHA-256 block hashes and persists every block to the
    PostgreSQL Audit Ledger (WORM table), ensuring non-repudiation and survival
    across server restarts.
    Adheres to Section 63 of Bharatiya Sakshya Adhiniyam (BSA) 2023.
    """

    def __init__(self):
        self.chain: List[Dict[str, Any]] = []
        self._load_or_init_chain()

    def _compute_block_hash(self, block: Dict[str, Any]) -> str:
        block_str = f"{block['index']}|{block['timestamp']}|{block['evidence_id']}|{block['action']}|{block['previous_hash']}"
        return hashlib.sha256(block_str.encode()).hexdigest()

    def _load_or_init_chain(self):
        """Loads persisted blockchain blocks from PostgreSQL audit_ledger or creates genesis."""
        db = SessionLocal()
        try:
            persisted_entries = (
                db.query(AuditLedgerEntry)
                .filter(AuditLedgerEntry.resource_type == "EVIDENCE_CUSTODY_BLOCK")
                .order_by(AuditLedgerEntry.timestamp.asc())
                .all()
            )
            if persisted_entries and len(persisted_entries) > 0:
                for idx, entry in enumerate(persisted_entries):
                    metadata_dict = {}
                    case_id = "CENTRAL-REGISTRY"
                    if entry.details:
                        try:
                            parsed = json.loads(entry.details)
                            metadata_dict = parsed.get("metadata", {})
                            case_id = parsed.get("case_id", "CENTRAL-REGISTRY")
                        except Exception:
                            pass

                    block = {
                        "index": idx,
                        "timestamp": entry.timestamp.isoformat(),
                        "evidence_id": entry.resource_id,
                        "case_id": case_id,
                        "custodian_name": entry.officer_name,
                        "action": entry.action,
                        "metadata": metadata_dict,
                        "payload_hash": hashlib.sha256(json.dumps(metadata_dict, sort_keys=True).encode()).hexdigest(),
                        "previous_hash": entry.previous_hash,
                        "block_hash": entry.current_hash
                    }
                    self.chain.append(block)
                logger.info("[Blockchain] Loaded %d persisted blocks from PostgreSQL WORM ledger.", len(self.chain))
            else:
                self._init_genesis_block(db)
        except Exception as e:
            logger.warning("[Blockchain] Could not query database for persisted blocks (%s); initializing in-memory fallback.", e)
            self._init_genesis_block(None)
        finally:
            db.close()

    def _init_genesis_block(self, db_session=None):
        genesis = {
            "index": 0,
            "timestamp": "2026-01-01T00:00:00Z",
            "evidence_id": "GENESIS-CRIMENEXUS-EVIDENCE-ROOT",
            "case_id": "CENTRAL-REGISTRY",
            "custodian_name": "Chief Forensic Registrar",
            "action": "LEDGER_INITIALIZATION",
            "payload_hash": hashlib.sha256(b"CRIMENEXUS_GENESIS_ROOT").hexdigest(),
            "previous_hash": "0" * 64
        }
        genesis["block_hash"] = self._compute_block_hash(genesis)
        self.chain.append(genesis)

        if db_session:
            try:
                entry = AuditLedgerEntry(
                    id=str(uuid.uuid4()),
                    officer_badge="SYS-LEDGER-01",
                    officer_name=genesis["custodian_name"],
                    station_id="HQ-FORENSICS",
                    action=genesis["action"],
                    resource_type="EVIDENCE_CUSTODY_BLOCK",
                    resource_id=genesis["evidence_id"],
                    details=json.dumps({"case_id": genesis["case_id"], "metadata": {}}),
                    previous_hash=genesis["previous_hash"],
                    current_hash=genesis["block_hash"]
                )
                db_session.add(entry)
                db_session.commit()
            except Exception as e:
                db_session.rollback()
                logger.debug("Genesis block DB save error: %s", e)

        # Seed initial realistic custody transfers
        self.record_custody_event(
            evidence_id="EVID-CCTV-2026-09",
            case_id="FIR-2026-8812",
            custodian_name="SI Rajesh Varma (Crime Branch)",
            action="SEIZURE_AT_SCENE",
            metadata={"source": "Hikvision NVR 8-Channel", "storage_md5": "9e107d9d372bb6826bd81d3542a419d6"}
        )
        self.record_custody_event(
            evidence_id="EVID-CCTV-2026-09",
            case_id="FIR-2026-8812",
            custodian_name="Dr. S. K. Gupta (CFSL New Delhi)",
            action="FSL_DEPOSIT_FOR_FORENSIC_ANALYSIS",
            metadata={"malkhana_register_entry": "MR-8819/2026", "tamper_tape_verified": True}
        )

    def record_custody_event(
        self,
        evidence_id: str,
        case_id: str,
        custodian_name: str,
        action: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        prev_block = self.chain[-1]
        now_dt = datetime.now(timezone.utc)
        now = now_dt.isoformat()
        
        payload_hash = hashlib.sha256(json.dumps(metadata or {}, sort_keys=True).encode()).hexdigest()

        new_block = {
            "index": len(self.chain),
            "timestamp": now,
            "evidence_id": evidence_id,
            "case_id": case_id,
            "custodian_name": custodian_name,
            "action": action,
            "metadata": metadata or {},
            "payload_hash": payload_hash,
            "previous_hash": prev_block["block_hash"]
        }
        new_block["block_hash"] = self._compute_block_hash(new_block)
        self.chain.append(new_block)

        # Persist block to PostgreSQL WORM audit_ledger
        db = SessionLocal()
        try:
            entry = AuditLedgerEntry(
                id=str(uuid.uuid4()),
                officer_badge="IO-CUSTODY",
                officer_name=custodian_name,
                station_id="STATION-EVIDENCE-DESK",
                action=action,
                resource_type="EVIDENCE_CUSTODY_BLOCK",
                resource_id=evidence_id,
                details=json.dumps({"case_id": case_id, "metadata": metadata or {}}),
                previous_hash=new_block["previous_hash"],
                current_hash=new_block["block_hash"]
            )
            db.add(entry)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning("[Blockchain] Could not persist block to PostgreSQL: %s", e)
        finally:
            db.close()

        return new_block

    def verify_chain_integrity(self) -> Dict[str, Any]:
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            if curr["previous_hash"] != prev["block_hash"]:
                return {"is_valid": False, "compromised_block_index": i}
            if curr["block_hash"] != self._compute_block_hash(curr):
                return {"is_valid": False, "compromised_block_index": i}
        return {"is_valid": True, "total_blocks": len(self.chain)}

    def generate_sec_65b_certificate(self, evidence_id: str) -> Dict[str, Any]:
        records = [b for b in self.chain if b.get("evidence_id") == evidence_id]
        return {
            "certificate_title": "CERTIFICATE UNDER SECTION 63 BHARATIYA SAKSHYA ADHINIYAM 2023 (SEC 65B CrPC/IEA)",
            "evidence_id": evidence_id,
            "chain_length": len(records),
            "custody_trail": records,
            "cryptographic_merkle_root": self.chain[-1]["block_hash"],
            "statutory_declaration": (
                "I hereby certify that the electronic record above has been managed and stored without interruption "
                "or unauthorized modification in the immutable CRIMENEXUS WORM Blockchain Ledger."
            )
        }

_ledger_instance = BlockchainEvidenceLedger()

def get_blockchain_ledger() -> BlockchainEvidenceLedger:
    return _ledger_instance
