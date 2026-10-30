# STANDARD OPERATING PROCEDURE (SOP) 03: SUPERVISORY COMMAND (SP / DCP / ACP / DSP)
**Document Reference:** CRIMENEXUS-SOP-03-COMMAND  
**Target Audience:** Superintendents of Police (SP), Deputy Commissioners of Police (DCP), Assistant Commissioners (ACP), Deputy SPs  
**Classification:** CONFIDENTIAL - LAW ENFORCEMENT COMMAND ONLY  
**Applicable Legal Framework:** Section 102/91 CrPC (Section 106/94 BNSS), Section 63 BSA 2023 / Section 65B IEA 1872

---

## 1. DUAL-OFFICER AUTHORIZATION FOR HIGH-CONSEQUENCE POLICE ACTIONS
In accordance with Supreme Court guidelines and departmental checks and balances, high-impact police interventions require a two-tier digital authorization process in CRIMENEXUS:
1. **Initiation:** The field Investigating Officer or Cyber Analyst initiates a request (e.g., Bank Account Freeze under Section 102 CrPC / Section 106 BNSS, Telecommunication Interception Order, or Look Out Circular).
2. **Review:** The Supervisory Officer receives the request under **Supervisory Approval Queue**.
3. **Decision & Digital Signing:**
   - The Supervisor reviews the intelligence summary, case rationale, and linked evidentiary nodes.
   - Upon clicking **Approve Warrant**, the system generates a cryptographically signed SHA-256 approval digest linked to the Supervisor's badge number.
   - Rejections require documented reasons for legal and departmental accountability.

---

## 2. SECTION 63 BSA / 65B IEA ELECTRONIC EVIDENCE CERTIFICATION
Electronic records presented as judicial evidence must satisfy statutory admissibility criteria.
1. **Generating Court Certificates:**
   - Navigate to **Evidentiary Compliance -> Electronic Evidence Certificate**.
   - Select the target evidence bundle (CDR dump, Bank Statement extract, or Graph snapshot).
   - Enter IO and Police Station particulars.
2. **Automated Statutory Attestation:**
   - The engine validates that the server operating environment was functioning properly during the acquisition period without systemic tampering.
   - Computes SHA-256 and MD5 bit-level cryptographic hashes.
   - Formulates the exact statutory declaration required under Section 63(4) of Bharatiya Sakshya Adhiniyam, 2023 and Section 65B(4) of Indian Evidence Act, 1872.
   - Outputs a print-ready, court-admissible certificate bearing a unique Certificate Reference Number.

---

## 3. IMMUTABLE WORM AUDIT TRAIL VERIFICATION
1. Prior to submitting evidence to prosecutors or trial courts:
   - Call the **Verify Audit Chain** endpoint (`GET /api/v1/legal/audit/verify-chain`).
   - The system validates every cryptographic block in the Write Once Read Many (WORM) audit chain from the Genesis block to current head.
   - Confirms zero internal tampering, zero backdating, and total chain of custody integrity.
