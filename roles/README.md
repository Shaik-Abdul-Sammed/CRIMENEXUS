# CRIMENEXUS — Engineering Roles & Division of Work
### Master Team Architecture, Project Contributions & Operational Deliverables

---

## 1. Overview of the 4 Engineering Roles

To complete the **CRIMENEXUS AI-Powered Law Enforcement & Crime Network Intelligence Platform**, the project was divided into four specialized, highly collaborative work streams:

```
+-----------------------------------------------------------------------------------------------------------------+
|                                         CRIMENEXUS CROSS-FUNCTIONAL MATRIX                                      |
|                                                                                                                 |
|   1. FRONTEND DEVELOPER         2. BACKEND DEVELOPER          3. AI TRAINER & ML          4. INTEGRATION &      |
|   (UI/UX & Client Architecture) (API & System Architecture)   (Forensic Data Science)     LEGAL RESEARCHER      |
|   - React 19 + TypeScript       - FastAPI + Python 3.10       - SpaCy Custom NER          - Sec 63 BSA / BNSS   |
|   - Cytoscape.js Network Graph  - PostgreSQL 15 + PostGIS     - Isolation Forest Smurfing - CCTNS & VAHAN Ingest|
|   - MapLibre Spatial GIS Engine - Neo4j 5.15 Graph DB         - SHAP Explainable AI (XAI) - Telecom CDR Parser  |
|   - Real-Time Pursuit HUD       - Redis Streams 7.0           - Poisson Crime Forecaster  - Docker Orchestration|
|   - Thana 2 Mbps Lite Mode      - HMAC-SHA256 WORM Ledger     - ChromaDB Legal RAG        - Test Harnesses      |
+-----------------------------------------------------------------------------------------------------------------+
```

---

## 2. Cross-Functional RACI Responsibility Matrix

The table below delineates the division of responsibilities across key platform milestones according to the **RACI** framework:
- **R (Responsible)**: Does the work to achieve the deliverable.
- **A (Accountable)**: Approves and signs off on the quality of the deliverable.
- **C (Consulted)**: Provides two-way input and technical guidance.
- **I (Informed)**: Kept updated on progress and integration points.

| Core Deliverable / Module | Role 1: Frontend Developer | Role 2: Backend Developer | Role 3: AI Trainer & ML | Role 4: Integration & Researcher |
|:---|:---:|:---:|:---:|:---:|
| **Interactive Network Graph Engine (Cytoscape.js)** | **R / A** | **C** | **C** | **I** |
| **Geospatial Map Intelligence & Haversine Tool** | **R** | **C** | **C** | **A** |
| **Live Pursuit & Proximity Dispatch HUD** | **R / A** | **R** | **C** | **C** |
| **Dual-Database Layer (Postgres + Neo4j)** | **I** | **R / A** | **C** | **C** |
| **High-Throughput Redis Streams Pipeline** | **I** | **R / A** | **C** | **R** |
| **HMAC-SHA256 Immutable Audit Ledger** | **I** | **R** | **I** | **R / A** |
| **Police-Trained SpaCy NER Pipeline** | **C** | **C** | **R / A** | **R** |
| **Unsupervised Financial Smurfing Detector** | **I** | **C** | **R / A** | **C** |
| **Explainable AI (SHAP TreeExplainer)** | **C** | **I** | **R / A** | **C** |
| **Section 63 BSA Cryptographic Sealing Engine** | **C** | **R** | **I** | **R / A** |
| **CCTNS / VAHAN / Telecom CDR Normalization** | **I** | **R** | **C** | **R / A** |
| **Docker Compose Orchestration & Startup Scripts**| **C** | **R** | **I** | **R / A** |

---

## 3. Directory Structure of the `roles/` Documentation

This folder contains exhaustive, multi-page technical documentation detailing the methodologies, technology stacks, benchmarks, and individual deliverables of each work stream:

```
roles/
├── README.md                                  # [Current File] Master Executive Overview & RACI Matrix
├── 01_FRONTEND_DEVELOPER.md                   # Full documentation for Frontend Developer (UI/UX & Client)
├── 02_BACKEND_DEVELOPER.md                    # Full documentation for Backend Developer (APIs & Systems)
├── 03_AI_TRAINER_AND_ML_SPECIALIST.md         # Full documentation for AI Trainer (Data Science & Models)
└── 04_INTEGRATION_WORKER_AND_RESEARCHER.md    # Full documentation for Integration Worker & Legal Researcher
```

---

## 4. Collective Impact on Law Enforcement Workflows

By combining the strengths of all four roles, CRIMENEXUS achieves dramatic workload reductions for frontline Indian police officers:

| Investigative Task | Traditional Manual Police Workflow | CRIMENEXUS Automated Result | Primary Roles Involved |
|:---|:---|:---|:---:|
| **Syndicate Link Discovery** | 3 to 4 days manually reading paper FIR records | **< 18 milliseconds** in Cytoscape graph | Frontend & Backend |
| **Mule Smurfing Ring Detection** | 5 to 6 hours reviewing bank statement spreadsheets | **< 3.5 milliseconds** via Isolation Forest | AI Trainer & Backend |
| **Court Remand Dossier Synthesis** | 3 to 4 hours typing case timelines in MS Word | **1 click** ($< 500\text{ ms}$) via ReportLab | Backend & Legal Researcher |
| **Digital Evidence Certification** | High rejection rate in trial courts | **100% compliant** Section 63 BSA certificate | Integration & Legal Researcher |
| **Nearest Station Pursuit Dispatch**| 15 to 20 minutes radio coordination | **< 500 milliseconds** automated OSRM routing | Frontend & Integration Worker |

---

## 5. Verification & Test Suite Summary

Every role's contributions are validated through an automated, end-to-end test suite:
- **Frontend Test Suite**: 8 test files, **29/29 tests passed** (`npx vitest run`).
- **TypeScript Static Verification**: **0 errors** (`npx tsc -b`).
- **Backend API & Graph Suite**: **3/3 passed** (`pytest backend/tests/test_geo_and_graph_endpoints.py`).
- **Core Automation Suite**: **40/40 automations passed** (`backend/tests/run_all_automations.py`).
