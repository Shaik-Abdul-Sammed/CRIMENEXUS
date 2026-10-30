# CRIMENEXUS: Security Architecture & Statutory Compliance
**Document Classification:** RESTRICTED / COMPLIANCE AUDIT & LEGAL INTEGRITY  
**Applicable Legal Frameworks:** 
- Bharatiya Sakshya Adhiniyam 2023 (Section 63 - Electronic Records)
- Indian Evidence Act 1872 (Section 65B - Admissibility of Electronic Evidence)
- Information Technology Act 2000 (Section 43A, 72A & Certifying Authority Guidelines)
- Prevention of Money Laundering Act 2002 (PMLA Section 12 & 17)
- Bharatiya Nagarik Suraksha Sanhita 2023 (Section 106 - Seizure & Production Directives)

---

## 1. Zero-Trust Identity & Access Management (IAM)

### Dual-Token Architecture (Access + Refresh):
1. **Access Tokens:** 
   - Cryptographic Standard: `HS256` signed using high-entropy secret.
   - Lifespan: Strictly limited to **15 minutes**.
   - Storage: Held in short-term application memory, reducing exfiltration window.
2. **Refresh Tokens:**
   - Lifespan: **7 days**.
   - Revocation: Stored with server-side issuance timestamp checks; immediately invalidated upon password change or administrative termination.
3. **Role-Based Access Control (RBAC):**
   - User roles (`INVESTIGATOR`, `ANALYST`, `SUPERVISOR`, `HQ_ADMIN`) are strictly decoded from verified JWT claims (`decoded_token["role"]`). Request bodies cannot spoof or escalate privileges.

---

## 2. API Abuse & Denial-of-Service Defense

### Rate Limiting Specification (SlowAPI / Leaky Bucket):
- **`/api/v1/auth/login`:** Restricted to `5 requests / minute` per client IP. Prevents automated brute-force attacks and credential harvesting.
- **`/api/v1/auth/refresh`:** Restricted to `20 requests / minute`.
- **API Payloads:** Strictly bounded by `MAX_UPLOAD_SIZE_BYTES = 10MB` to eliminate memory exhaustion and buffer bloat DoS.

---

## 3. Cryptographic WORM Audit Ledger (Write-Once, Read-Many)

Police evidence tampering is a severe legal vulnerability. CRIMENEXUS implements an append-only, chained cryptographic audit ledger in PostgreSQL (`audit_ledger`).

### HMAC-SHA256 Chaining Protocol:
Unlike simple SHA-256 hashes which can be recalculated sequentially by an unauthorized database admin, CRIMENEXUS signs each audit block using a server-side secret key via `HMAC-SHA256`:

$$\text{Block Hash}_n = \text{HMAC-SHA256}\Big(\text{Key}_{\text{HMAC}}, \;\; \text{Hash}_{n-1} \,\|\, \text{Timestamp} \,\|\, \text{Officer ID} \,\|\, \text{Action} \,\|\, \text{Payload Hash}\Big)$$

### Mathematical Immutability Guarantee:
- Any alteration to historical audit records invalidates every subsequent block's HMAC signature.
- Verification algorithm: `app.services.legal.audit_service.verify_ledger_integrity()` traverses and mathematically verifies the entire chain prior to court submission.

---

## 4. Input Sanitization & Anti-Injection Defenses

### A. Cypher Injection Prevention:
All graph database queries in `backend/app/api/network.py`, `nlp_extractor.py`, and `seed_demo_data.py` use parameterized arguments (`$param`) rather than f-strings or string concatenation:
```python
# SECURE: Fully parameterized Cypher
execute_cypher(
    "MATCH (s:Person {name: $name}) RETURN s",
    {"name": suspect_name}
)
```

### B. Cross-Site Scripting (XSS) Sanitization:
All user-entered case narratives, FIR text, and witness statements are sanitized using Mozilla `bleach` (`strip=True, tags=[]`) before persistence to PostgreSQL.

### C. CSV / Formula Injection Neutralization:
Telecom CDR and bank statement files frequently contain malicious spreadsheet formulas (`=cmd|' /C ...'!A1`).
In `bank_parser.py` and `cdr_parser.py`:
```python
def sanitize_csv_cell(value: Any) -> str:
    text = str(value).strip()
    if text and text[0] in ['=', '+', '-', '@']:
        return "'" + text  # Neutralizes formula execution in Microsoft Excel / LibreOffice
    return text
```

---

## 5. Section 63 BSA & Section 65B IEA Court Admissibility Framework

To ensure electronic intelligence gathered by CRIMENEXUS stands judicial scrutiny in Indian courts, the system automatically binds every ingested evidentiary artifact with statutory compliance metadata:

### Mandatory Certificate Metadata Elements:
1. **Source Hash (SHA-256):** Generated immediately upon file receipt before database entry.
2. **Device Hardware Identifier:** Captures server host CPU ID and MAC address.
3. **Chain of Custody Timestamp:** Synchronized with National Physical Laboratory (NPL) Indian Standard Time (IST) NTP servers.
4. **Dual-Warrant Verification:** Requires supervisory approval (`DualWarrantAuthorization`) for privileged telephone interception and bank account freezing directives.
5. **Examiner Endorsement:** Structured template compliant with Part B of Section 63 BSA Schedule.

```
+-------------------------------------------------------------------------+
|                  CERTIFICATE UNDER SECTION 63 OF BSA 2023               |
|                      (SECTION 65B INDIAN EVIDENCE ACT)                  |
+-------------------------------------------------------------------------+
| Evidence Identifier: EVID-TELECOM-CDR-890                               |
| Cryptographic Hash (SHA-256): 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2|
| System Identifier: SRV-DEL-POLICE-HQ-01                                 |
| Operating Condition: The computer system was operating properly during |
| the entire period of evidence ingestion with no data corruption.       |
| Cryptographic Audit Block: #1084 (HMAC Signature Verified)             |
+-------------------------------------------------------------------------+
```
