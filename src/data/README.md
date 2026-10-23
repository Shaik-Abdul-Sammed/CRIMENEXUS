# CRIMENEXUS Master Synthetic Dataset Documentation

> **Single Source of Truth for CRIMENEXUS Frontend Demonstration Data**  
> **Path:** `src/data/crimenexus-dataset.txt`  

---

## 🔒 Purpose & Ethical Disclaimer

`crimenexus-dataset.txt` contains the complete master synthetic demonstration dataset for the CRIMENEXUS investigation assistance platform.

### Ethical & Legal Guardrails:
- **100% Synthetic Data:** All names, telephone numbers, email addresses, vehicle registration numbers, bank accounts, UPI IDs, cryptocurrency wallet hashes, locations, evidence descriptions, and case summaries are completely synthetic.
- **No Real PII / Real Investigation Data:** No real person's personal identifiable information (PII) or real criminal records are used.
- **Investigation Assistance Only:** The dataset provides structured demonstration telemetry to evaluate the platform's multi-entity relationship graph engine, chronological timeline, entity resolution, and AI RAG query interface.

---

## 📁 Dataset Section Structure (27 Sections)

The master text dataset is organized into 27 human-readable sections:

| Section # | Section Title | Description & Purpose | Min Requirement | Current Items |
|-----------|---------------|-----------------------|-----------------|---------------|
| **1** | `# SECTION 1 — USERS` | System user accounts and RBAC role personas | >= 4 | **6** |
| **2** | `# SECTION 2 — CASES / INVESTIGATIONS` | Master criminal investigation dossiers | >= 12 | **12** |
| **3** | `# SECTION 3 — PERSON ENTITIES` | Primary target & associate person entities | >= 25 | **26** |
| **4** | `# SECTION 4 — PHONE ENTITIES` | Telecommunication SIM cards & CDR nodes | >= 20 | **22** |
| **5** | `# SECTION 5 — EMAIL ENTITIES` | Digital email identities & accounts | >= 15 | **16** |
| **6** | `# SECTION 6 — VEHICLES` | Vehicle registrations & ANPR targets | >= 15 | **16** |
| **7** | `# SECTION 7 — BANK ACCOUNTS` | Financial institution accounts | >= 12 | **14** |
| **8** | `# SECTION 8 — UPI IDs` | Unified Payments Interface handles | >= 12 | **14** |
| **9** | `# SECTION 9 — CRYPTO WALLETS` | On-chain cryptocurrency wallet nodes | >= 8 | **10** |
| **10** | `# SECTION 10 — ORGANIZATIONS` | Shell firms & corporate entities | >= 10 | **12** |
| **11** | `# SECTION 11 — DEVICES` | Mobile hardware & IMEI devices | >= 15 | **16** |
| **12** | `# SECTION 12 — SOCIAL ACCOUNTS` | Encrypted messaging handles | >= 15 | **16** |
| **13** | `# SECTION 13 — LOCATIONS` | Spatial telemetry coordinates | >= 25 | **26** |
| **14** | `# SECTION 14 — EVIDENCE` | Forensic evidence ledger artifacts | >= 50 | **52** |
| **15** | `# SECTION 15 — RELATIONSHIPS` | Relational network graph edges | >= 70 | **75** |
| **16** | `# SECTION 16 — TIMELINE EVENTS` | Chronological activity stream logs | >= 100 | **102** |
| **17** | `# SECTION 17 — FINANCIAL TRANSACTIONS` | Money wire & transfer records | >= 30 | **32** |
| **18** | `# SECTION 18 — VEHICLE SIGHTINGS` | ANPR camera detection logs | >= 25 | **26** |
| **19** | `# SECTION 19 — COMMUNICATIONS` | Call detail records (CDR) & SMS logs | >= 30 | **32** |
| **20** | `# SECTION 20 — ENTITY RESOLUTION CANDIDATES` | De-duplication candidate match pairs | >= 15 | **16** |
| **21** | `# SECTION 21 — AI FINDINGS` | Grounded RAG intelligence insights | >= 20 | **22** |
| **22** | `# SECTION 22 — REPORTS` | Master intelligence report dossiers | >= 12 | **14** |
| **23** | `# SECTION 23 — AUDIT LOGS` | System security audit trail events | >= 80 | **84** |
| **24** | `# SECTION 24 — NOTIFICATIONS` | System & investigator alert items | >= 20 | **22** |
| **25** | `# SECTION 25 — DASHBOARD METRICS` | Derived metrics summary object | 1 Object | **1** |
| **26** | `# SECTION 26 — GRAPH CONFIGURATION` | Visual styling taxonomy for Cytoscape | 1 Object | **1** |
| **27** | `# SECTION 27 — SEARCH INDEX` | Pre-indexed search records | Structured | **27** |

---

## 🆔 ID Naming Conventions & Referential Integrity

All entities and records use explicit, unique ID prefixes:

- **Users:** `usr-1`, `usr-2`...
- **Cases:** `case-101`, `case-102`...
- **Person Entities:** `ent-p-1`, `ent-p-2`...
- **Phone Entities:** `ent-ph-1`, `ent-ph-2`...
- **Email Entities:** `ent-em-1`, `ent-em-2`...
- **Vehicles:** `ent-vh-1`, `ent-vh-2`...
- **Bank Accounts:** `ent-ba-1`, `ent-ba-2`...
- **UPI IDs:** `synthetic.mule.X@exampleupi`
- **Crypto Wallets:** `ent-cw-1`, `ent-cw-2`...
- **Organizations:** `ent-org-1`, `ent-org-2`...
- **Devices:** `ent-dev-1`, `ent-dev-2`...
- **Locations:** `loc-1`, `loc-2`...
- **Evidence Records:** `ev-101`, `ev-102`...
- **Relationships:** `rel-1`, `rel-2`...
- **Timeline Events:** `evt-1`, `evt-2`...

### Referential Integrity Enforcer:
The application includes a automatic validation service ([src/services/mock/datasetValidator.ts](file:///home/vamsi/CRIMENEXUS/src/services/mock/datasetValidator.ts)) that validates:
- Zero duplicate IDs across collections.
- Zero broken foreign keys (all `caseIds`, `entityIds`, `evidenceIds`, `userIds`, `locationIds` point to existing valid IDs).
- Complete enum validity across roles, crime categories, risk levels, and statuses.

---

## ⚙️ How Frontend Services Consume the Data

1. **Loader Layer ([src/services/mock/datasetLoader.ts](file:///home/vamsi/CRIMENEXUS/src/services/mock/datasetLoader.ts)):**
   - Reads `crimenexus-dataset.txt` using Vite text loader (`?raw`).
   - Parses section JSON blocks and transforms raw datasets into strongly typed TypeScript domain models.
   - Runs structural validation on startup.
2. **Mock Data Abstraction Layer ([src/services/mockData.ts](file:///home/vamsi/CRIMENEXUS/src/services/mockData.ts)):**
   - Re-exports loaded collections (`MOCK_USERS`, `MOCK_CASES`, `MOCK_ENTITIES`, etc.).
3. **API Service Layer ([src/services/api.ts](file:///home/vamsi/CRIMENEXUS/src/services/api.ts)):**
   - Serves async query requests to React Query hooks and syncs runtime edits (e.g. case creation, evidence uploads, entity reviews, merge confirmations) to `localStorage`.

---

## 🔌 Future Backend API Replacement

When replacing this synthetic mock layer with real backend microservices in production:

1. Replace `loadMasterDataset()` in `src/services/api.ts` with Axios/Fetch calls to your backend endpoints (`/api/v1/cases`, `/api/v1/graph`, `/api/v1/evidence`, `/api/v1/ai`).
2. Maintain the domain interfaces in `src/types/index.ts` to preserve total UI component compatibility.
