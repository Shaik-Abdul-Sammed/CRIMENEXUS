# STANDARD OPERATING PROCEDURE (SOP) 01: STATION DUTY & INVESTIGATING OFFICERS
**Document Reference:** CRIMENEXUS-SOP-01-OPS  
**Target Audience:** Station Duty Officers (SDO), Investigating Officers (IO), Sub-Inspectors, Station House Officers (SHO)  
**Classification:** RESTRICTED - LAW ENFORCEMENT INTERNAL USE ONLY  
**Applicable Legal Framework:** Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 / Code of Criminal Procedure (CrPC), 1973

---

## 1. PURPOSE & APPLICABILITY
This SOP outlines the mandatory procedure for operational police officers to ingest first-response crime data, vehicle movement records, witness testimonies, and First Information Reports (FIRs) into the **CRIMENEXUS Platform**.

---

## 2. FIRST INFORMATION REPORT (FIR) INGESTION
When an FIR is registered under IPC or BNS sections:
1. **Accessing the Portal:**
   - Log into CRIMENEXUS using your State Police Station Badge ID and 2FA Authenticator.
   - Navigate to **Data Ingestion -> Police Reports & FIRs**.
2. **Text & Narrative Input:**
   - Enter the official FIR number (e.g., `FIR-2026-UP-NOIDA-0142`).
   - Paste or upload the verbatim FIR narrative text.
3. **Automated NLP Extraction:**
   - Click **Run Forensic Extraction**.
   - The integrated AI Natural Language Processing (NLP) engine will automatically identify and tag:
     - Penal Sections (e.g., *Section 420, 120B, 384 IPC* or *BNS equivalents*).
     - Named suspects, aliases, and co-conspirators.
     - Mentioned motor vehicle license plates.
     - Extracted phone numbers and bank account numbers.
4. **Relational & Graph Sync:**
   - Confirm extracted entities. The system automatically creates Person and Vehicle nodes and links them to the active Investigation Case.

---

## 3. VEHICLE SIGHTING & CCTV ANPR LOGGING
When field surveillance or CCTV footage detects suspect movement:
1. Navigate to **Data Ingestion -> Vehicle Sightings**.
2. Input the License Plate Number, Camera/Toll Location (e.g., *DND Flyway*, *Yamuna Expressway KM 48*), and observation timestamp.
3. If plate matches any ongoing syndicate or hotlist, CRIMENEXUS triggers an immediate **Red Alert Sighting Notification**.
4. Inquire via the integrated **VAHAN 4.0 Query Tool** to fetch verified vehicle ownership, chassis numbers, and stolen status.

---

## 4. WITNESS STATEMENTS & CALL RECORD LOGGING
1. Upload witness examination transcripts under Section 161 CrPC / Section 180 BNSS.
2. Ingest CDR spreadsheets provided by telecom service nodal officers (see SOP 02).
3. Every data entry action is automatically cryptographically hashed and entered into the WORM Audit Ledger with your Officer Badge ID.

---

## 5. INCIDENT ESCALATION & CASE TRANSFER
- If a case involves multi-jurisdictional connections spanning outside your police district, submit an **Inter-Agency Collaboration Request** via the Cases tab.
- This unlocks cross-station graph node visibility without breaching data partition boundaries.
