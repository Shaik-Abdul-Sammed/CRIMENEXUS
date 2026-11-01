"""
Strict Bank CSV Data Validation Engine for CRIMENEXUS.
Validates financial CSV schemas, sanitizes formula injection, checks type constraints,
and filters corrupted records before database insertion.
"""

import csv
import io
from datetime import datetime
from typing import Dict, Any, List, Tuple

REQUIRED_COLUMNS = {"transaction_id", "timestamp", "sender_account", "beneficiary_account", "amount"}

COLUMN_ALIASES = {
    "txn_id": "transaction_id",
    "tx_id": "transaction_id",
    "trans_id": "transaction_id",
    "date": "timestamp",
    "date_time": "timestamp",
    "time": "timestamp",
    "sender": "sender_account",
    "from_account": "sender_account",
    "source_account": "sender_account",
    "beneficiary": "beneficiary_account",
    "to_account": "beneficiary_account",
    "dest_account": "beneficiary_account",
    "receiver_account": "beneficiary_account",
    "txn_amount": "amount",
    "transaction_amount": "amount",
    "value": "amount"
}

def sanitize_csv_formula(val: Any) -> str:
    """Sanitizes CSV formula injection attacks starting with =, +, -, @, or tab/CR."""
    s = str(val or "").strip()
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + s
    return s

def validate_account_format(account: str) -> bool:
    """Validates banking account string (alphanumeric, length 6-34, standard IBAN/account)."""
    if not account or not isinstance(account, str):
        return False
    clean = account.strip().replace("-", "").replace(" ", "")
    return 6 <= len(clean) <= 34 and clean.isalnum()

def parse_iso_or_standard_date(ts_str: str) -> str:
    """Parses heterogeneous date strings into strict ISO-8601 string."""
    clean = ts_str.strip().replace("Z", "")
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f",
        "%d/%m/%Y %H:%M:%S",
        "%d-%m-%Y %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y"
    ):
        try:
            return datetime.strptime(clean, fmt).isoformat()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(clean).isoformat()
    except Exception:
        raise ValueError(f"Unparseable date timestamp: {ts_str}")

def validate_bank_csv_content(csv_content: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Strictly validates raw bank CSV string:
    - Verifies headers against REQUIRED_COLUMNS (using canonical aliases).
    - Checks row-by-row types: amount > 0, valid account formats, valid timestamps.
    - Collects rejected rows with explicit forensic reason codes.
    - If corruption rate exceeds 50%, raises ValueError to protect evidence integrity.
    """
    if not csv_content or not csv_content.strip():
        raise ValueError("Bank statement file is empty.")

    f = io.StringIO(csv_content.strip())
    reader = csv.DictReader(f)
    if not reader.fieldnames:
        raise ValueError("Bank CSV missing header row.")

    # Canonicalize header names
    header_map = {}
    for col in reader.fieldnames:
        clean_col = col.strip().lower().replace(" ", "_")
        canonical = COLUMN_ALIASES.get(clean_col, clean_col)
        header_map[col] = canonical

    canonical_headers = set(header_map.values())
    missing_required = REQUIRED_COLUMNS - canonical_headers
    if missing_required:
        raise ValueError(f"Missing mandatory banking columns in CSV: {sorted(list(missing_required))}")

    valid_rows: List[Dict[str, Any]] = []
    rejected_rows: List[Dict[str, Any]] = []

    for row_idx, raw_row in enumerate(reader, start=1):
        reasons = []
        row = {header_map[k]: sanitize_csv_formula(v) for k, v in raw_row.items() if k in header_map}

        # Check transaction_id
        txn_id = row.get("transaction_id", "").strip()
        if not txn_id:
            reasons.append("Empty transaction_id")

        # Check amount
        raw_amt = row.get("amount", "")
        amount = 0.0
        try:
            amount = float(str(raw_amt).replace(",", "").replace("₹", "").strip())
            if amount <= 0:
                reasons.append(f"Non-positive transaction amount: {amount}")
        except Exception:
            reasons.append(f"Invalid numeric amount value: {raw_amt}")

        # Check sender and beneficiary
        sender = row.get("sender_account", "").strip()
        beneficiary = row.get("beneficiary_account", "").strip()
        if not validate_account_format(sender):
            reasons.append(f"Invalid sender account format: {sender}")
        if not validate_account_format(beneficiary):
            reasons.append(f"Invalid beneficiary account format: {beneficiary}")
        if sender and beneficiary and sender == beneficiary:
            reasons.append("Self-loop transfer: sender and beneficiary accounts are identical")

        # Check timestamp
        raw_ts = row.get("timestamp", "").strip()
        parsed_ts = None
        if raw_ts:
            try:
                parsed_ts = parse_iso_or_standard_date(raw_ts)
            except Exception as e:
                reasons.append(str(e))
        else:
            reasons.append("Missing transaction timestamp")

        if reasons:
            rejected_rows.append({
                "row_index": row_idx,
                "reasons": reasons,
                "raw_data": raw_row
            })
        else:
            valid_rows.append({
                "transaction_id": txn_id,
                "timestamp": parsed_ts,
                "sender_account": sender,
                "beneficiary_account": beneficiary,
                "amount": amount,
                "transaction_type": row.get("transaction_type", "IMPS/NEFT"),
                "remarks": row.get("remarks", "")
            })

    total_rows = len(valid_rows) + len(rejected_rows)
    rejection_rate = (len(rejected_rows) / total_rows) if total_rows > 0 else 0.0

    summary = {
        "total_rows_inspected": total_rows,
        "valid_rows_count": len(valid_rows),
        "rejected_rows_count": len(rejected_rows),
        "rejection_rate_pct": round(rejection_rate * 100, 2),
        "rejected_details": rejected_rows[:20]  # First 20 audit samples
    }

    if total_rows > 0 and rejection_rate > 0.50:
        raise ValueError(
            f"Evidence Rejection: High CSV corruption rate ({summary['rejection_rate_pct']}% > 50%). "
            f"File likely malformed or unauthorized format."
        )

    return valid_rows, summary
