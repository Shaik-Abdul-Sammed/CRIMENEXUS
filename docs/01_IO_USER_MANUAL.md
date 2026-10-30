# CRIMENEXUS: Investigating Officer (IO) User Manual
**Document Classification:** RESTRICTED / LAW ENFORCEMENT INTERNAL USE ONLY  
**Applicability:** State Police Departments, Special Cells, Cyber Crime Police Stations  
**Statutory Alignment:** Bharatiya Nagarik Suraksha Sanhita (BNSS 2023), Bharatiya Sakshya Adhiniyam (BSA 2023), IT Act 2000, Prevention of Money Laundering Act (PMLA 2002)

---

## 1. Executive Summary & Purpose
CRIMENEXUS is an AI-powered intelligence orchestration platform designed to assist police investigators in solving complex, multi-jurisdictional crime syndicates. It automates:
- **Zero-Click FIR Entity Extraction**: Automatically ingests FIRs, extracts suspects, phone numbers, vehicle license plates, and legal sections, and links them into an interactive criminal graph.
- **Financial Tripwire Alerts**: Instantly flags hawala structuring/smurfing deposits under ₹50,000 into suspect bank accounts.
- **Telecom & Movement Fusion**: Correlates multi-carrier CDR tower pings with highway ANPR cameras on MapLibre geospatial maps.
- **Evidentiary Integrity**: Generates court-admissible Section 63 BSA / Section 65B IEA electronic certificates backed by cryptographic HMAC ledger logs.

---

## 2. Accessing the System & Daily Login
1. Open your designated police terminal browser (Chrome/Chromium recommended).
2. Navigate to: `http://localhost:5173` (or departmental internal IP `http://10.x.x.x`).
3. Enter your assigned Police ID & Password:
   - **Inspector Account:** `inspector@police.gov.in` / `PoliceSecurePass2026!`
   - **Station Supervisor:** `supervisor@police.gov.in` / `PoliceSecurePass2026!`
4. Session lifetime is strictly limited to **15 minutes** with automatic token renewal to prevent unauthorized shoulder surfing in station premises.

---

## 3. Module 1: Ingesting FIRs & Case Statements (Zero-Click Linkage)

### Step-by-Step Workflow:
1. Navigate to **Evidence & Ingestion** or **Case Detail** from the sidebar.
2. Select **Upload FIR / Narrative Document**.
3. Choose either:
   - **PDF Upload:** Direct digital or scanned police report (`.pdf`).
   - **Text Narrative:** Copy-paste raw police station diary entry or witness statement.
4. Fill in Case Details:
   - **Case / Crime Number:** e.g., `FIR-2026-CRIME-890`
   - **Title:** e.g., `Illicit Hawala & Extortion Syndicate`
   - **Investigating Officer:** `Inspector V. K. Sharma`
5. Click **Ingest & Extract Forensic Entities**.

### What Happens Automatically Behind the Scenes:
- The system automatically extracts IPC/BNS legal sections (`Section 420, 120B IPC`, `Section 66D IT Act`).
- Suspect names (`Rajan`, `Vikram Malhotra`) are extracted and matched against existing criminal syndicate graphs.
- Burner phone numbers (`+91 99999 88888`) and vehicles (`TS 09 AB 1234`) are cross-linked to the suspect with zero manual data entry.

---

## 4. Module 2: Reading & Navigating the Network Graph

1. Click on **Network Graph** from the navigation menu.
2. The interactive graph visualization displays nodes and relationships:
   - **Red Nodes:** Primary Kingpins & High-Threat Suspects (e.g., `Rajan`, `Risk: 95%`).
   - **Orange Nodes:** Identified Burner Phones & SIM Cards (e.g., `+91 98765 43210`, `+91 99999 88888`).
   - **Purple Nodes:** Sighted Vehicles & Convoy Transports (e.g., `TS 09 AB 1234`).
   - **Green Nodes:** Flagged Beneficiary & Shell Company Bank Accounts (e.g., `ACC-HDFC-908122`).
   - **Blue Nodes:** Known Associates & Money Couriers (e.g., `Suresh`, `Vikram`).
3. **Graph Actions:**
   - **Click on any node:** Opens the forensic dossier showing risk scores, active cases, and recent sightings.
   - **Filter Layout:** Switch between Force-Directed (fCoSE) and Concentric views.
   - **Export Evidence Graph:** Click "Export High-Res Graph PNG" for inclusion in Case Diary (CD) / Charge Sheet.

---

## 5. Module 3: Responding to Financial Tripwire Alerts (Smurfing)

### The Smurfing Tripwire Rule:
When 3 or more transactions under the ₹50,000 threshold occur within 48 hours into the same beneficiary account from multiple senders, a **CRITICAL RED TRIPWIRE BANNER** is displayed at the top of the Dashboard.

### Action Directive:
1. Review the red alert banner:  
   `"Action Required: Freeze Account ACC-HDFC-908122 due to Smurfing"`
2. Click **Freeze Account Now**:
   - The platform transmits an automated Section 102 CrPC / Section 106 BNSS notice template to the bank nodal officer.
   - Logs the debit freeze action into the tamper-proof police ledger.
3. Verify the associated shell company (`Apex Trading Co.`) in the Financial Intelligence view.

---

## 6. Module 4: Geospatial Movement Map & Transit Timeline

1. Navigate to **Map Intelligence** (`/map`).
2. The map displays the suspect's movement timeline correlating:
   - **Amber Dots (#):** Cellular tower pings extracted from multi-carrier CDRs.
   - **Purple Dots (#):** Highway ANPR camera detections from toll booths and city entry gates.
   - **Cyan Line:** Interpolated transit trajectory showing vehicle flight path.
3. Click any numbered waypoint in the **Chronological Breadcrumb Ribbon** to scrub and replay the route taken by the suspect convoy.

---

## 7. Module 5: Generating Court-Admissible Electronic Evidence (Section 63 BSA / 65B IEA)

Under the Bharatiya Sakshya Adhiniyam 2023 (Section 63) and Indian Evidence Act (Section 65B), electronic records submitted in court must be accompanied by a mandatory certificate of technological integrity.

1. Navigate to **Evidence Detail** for any ingested file.
2. Click **Generate Section 63 BSA Certificate**.
3. The platform generates an official PDF certificate containing:
   - SHA-256 cryptographic hash of the raw evidence file.
   - Operating system and server hardware serial identifiers.
   - HMAC chain block index from the WORM audit ledger.
   - Investigating Officer electronic verification token.
4. Print and sign Schedule Part B alongside the Cyber Forensic Examiner.

---

## 8. IO Emergency Checklist
| Situation | Recommended Action |
|:---|:---|
| Suspect changes phone number | Upload new FIR/statement narrative; the system automatically merges the new phone to the suspect's existing profile. |
| Rapid cash dissipation | Check Dashboard for smurfing banner; trigger Section 102 CrPC freeze immediately. |
| Vehicle spotted on highway | Open Map Intelligence to view the predicted next toll plaza checkpoint. |
| Court summons for evidence | Export the Section 63 BSA Certificate directly from the Evidence Vault. |
