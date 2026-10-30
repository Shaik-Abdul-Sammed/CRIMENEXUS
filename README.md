# CRIMENEXUS — AI Criminal Network Intelligence Platform

[![CI/CD Pipeline](https://github.com/Shaik-Abdul-Sammed/CRIMENEXUS/actions/workflows/ci.yml/badge.svg)](https://github.com/Shaik-Abdul-Sammed/CRIMENEXUS/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose%20Ready-2496ED.svg)](docker-compose.prod.yml)
[![Compliance](https://img.shields.io/badge/Compliance-Sec%2063%20BSA%20%2F%2065B%20IEA-red.svg)](docs/03_SECURITY_AND_COMPLIANCE.md)

> **Multi-Source Criminal Relationship Discovery & Investigation Assistant**  
> *AI-Powered Crime Network Analysis, Dual-Database Engine (PostgreSQL + Neo4j) & Cytoscape Topology Visualization*

---

## ⚡ 1-Click Production Deployment (Zero-Cost Hosting)

Deploy the entire hardened stack — Nginx Frontend (Port 80), FastAPI Backend (Port 8000), Isolated PostgreSQL 15, and Isolated Neo4j 5.24 Graph Engine:

```bash
# 1. Compile production frontend bundle
npm run build

# 2. Launch production container stack (Free & Open Source)
docker compose -f docker-compose.prod.yml up -d
```

### Access Points:
| Service | URL | Notes |
| :--- | :--- | :--- |
| **Frontend Web App** | [`http://localhost`](http://localhost) | Reverse-proxied via Nginx on port 80 |
| **Backend REST API** | [`http://localhost:8000`](http://localhost:8000) | FastAPI Engine & CCTNS Gateway |
| **Relational DB** | `Internal Docker Net` | Port 5432 (Isolated from external access) |
| **Graph DB Engine** | `Internal Docker Net` | Port 7687 (Isolated from external access) |

---

## 📖 Police Department Documentation Suite

Complete operational documentation for law enforcement agencies and IT units:
- **[01. Investigating Officer (IO) User Manual](docs/01_IO_USER_MANUAL.md)**: Non-technical manual for FIR ingestion, graph analysis, and smurfing tripwire alerts.
- **[02. Police Headquarters IT Admin Guide](docs/02_HQ_ADMIN_GUIDE.md)**: Server setup, air-gapped installation, disaster recovery, and JWT secret key management.
- **[03. Security & Legal Compliance](docs/03_SECURITY_AND_COMPLIANCE.md)**: Section 63 BSA / 65B IEA evidence validation, HMAC-SHA256 WORM audit ledger.
- **[04. Formal Police Submission Proposal](docs/04_POLICE_SUBMISSION_PROPOSAL.md)**: Executive proposal for Director General of Police (DGP) / Commissioner pilot approval.

---

---

## 🔒 Scope & Ethical Compliance Statement

**CRIMENEXUS** is an **INVESTIGATION ASSISTANCE** platform designed to assist law enforcement analysts and investigators in organizing multi-source intelligence, mapping complex relational topologies, and visualizing chronological timelines.

### Ethical & Legal Guardrails:
- **Investigative Assistance Only:** All AI-synthesized findings serve solely as decision support.
- **No Autonomous Decisions:** The platform does NOT determine guilt or innocence, assign criminal propensity scores, or execute automated law enforcement actions.
- **Human Review Required:** All entity resolution matches and AI insights require manual confirmation by a certified analyst.
- **Synthetic Data Usage:** All data presented in this application is entirely synthetic and generated for demonstration and testing purposes.

---

## 🚀 Key Features

- **Hero Feature — Cytoscape.js Network Graph Engine:**
  - Interactive graph visualization with 5 layout engines (Force CoSE, Dagre Hierarchical, Circular, Concentric, Grid).
  - Entity-type filters (`PERSON`, `PHONE`, `EMAIL`, `VEHICLE`, `BANK_ACCOUNT`, `ORGANIZATION`, `CRYPTO_WALLET`, `LOCATION`).
  - Edge confidence threshold range slider & node focus search.
  - Export network graph as high-resolution PNG.
- **Entity Resolution Interface:**
  - Attribute similarity scoring, matching vs conflicting evidence breakdown.
  - Manual `CONFIRM`, `REJECT`, or `DEFER` actions with automatic audit event creation.
- **Grounded AI Investigation Assistant:**
  - Natural language RAG query interface with pre-configured investigative prompts.
  - Grounded findings backed by verified evidence ledger IDs and linked target entities.
  - Mandatory legal disclaimer banner.
- **Geospatial Map Intelligence (MapLibre GL JS):**
  - Dark-mode spatial telemetry mapping cell tower pings, ANPR vehicle toll sightings, and safehouse crime scenes.
  - Interactive marker selection with detailed spatial telemetry inspector.
- **Evidence Vault & Chain of Custody:**
  - Hashed artifact ledger storing documents, CCTV frames, call detail records (CDR), financial ledgers, and vehicle sightings.
  - React Hook Form + Zod validated upload modal with simulated SHA-256 hash calculation.
- **System Security Audit Logs:**
  - Real-time audit log stream tracking user logins, graph investigations, entity merges, AI queries, and report exports.
  - Persistent storage in `localStorage` across session reloads.
- **Role-Based Access Control (RBAC) Simulator:**
  - Pre-configured demo personas (`INVESTIGATOR`, `ANALYST`, `SUPERVISOR`, `ADMIN`) with instant role switching.

---

## 🛠️ Technology Stack

- **Core Framework:** React 19 (`react` ^19.0.0, `react-dom` ^19.0.0) + Vite 6.1.0 (`vite` ^6.1.0)
- **Language:** TypeScript 5.7.3 (`strict: true`)
- **State Management:**
  - `Zustand` (v5.0.3) for UI state & active role session.
  - `@tanstack/react-query` (v5.66.0) for server-like async state.
- **Styling & UI:** Tailwind CSS v3 (`tailwindcss` ^3.4.17) + Lucide React (`lucide-react`) + custom UI primitives.
- **Graph Visualization:** `Cytoscape.js` (^3.30.4) + `cytoscape-dagre` + `cytoscape-fcose`.
- **Map Visualization:** `MapLibre GL JS` (^5.1.0).
- **Form Management & Validation:** `React Hook Form` (^7.54.2) + `Zod` (^3.24.2).
- **Testing Suite:** Vitest (`vitest` ^3.0.5) + React Testing Library + Playwright.

---

## 📂 Repository Structure

```
CRIMENEXUS/
├── src/
│   ├── app/ (AppLayout.tsx)
│   ├── components/
│   │   ├── layout/ (TopNav.tsx, Sidebar.tsx, GlobalSearchModal.tsx)
│   │   └── ui/ (Badge.tsx, Button.tsx, Card.tsx, Input.tsx, Modal.tsx)
│   ├── features/
│   │   ├── assistant/ (AIAssistantPage.tsx)
│   │   ├── audit/ (AuditLogsPage.tsx)
│   │   ├── auth/ (LoginPage.tsx, ProtectedRoute.tsx)
│   │   ├── cases/ (CasesPage.tsx, CaseDetailPage.tsx)
│   │   ├── dashboard/ (DashboardPage.tsx)
│   │   ├── entities/ (EntitiesPage.tsx, EntityDetailPage.tsx)
│   │   ├── evidence/ (EvidencePage.tsx, EvidenceDetailPage.tsx)
│   │   ├── graph/ (NetworkGraphPage.tsx)
│   │   ├── map/ (MapIntelligencePage.tsx)
│   │   ├── reports/ (ReportsPage.tsx)
│   │   ├── resolution/ (EntityResolutionPage.tsx)
│   │   ├── settings/ (SettingsPage.tsx)
│   │   └── timeline/ (TimelinePage.tsx)
│   ├── hooks/ (useIntelligenceApi.ts)
│   ├── services/ (api.ts, mockData.ts)
│   ├── stores/ (appStore.ts, authStore.ts)
│   ├── types/ (index.ts)
│   ├── utils/ (cn.ts, formatters.ts)
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── tests/
│   ├── e2e/ (flows.spec.ts)
│   ├── integration/ (auth.test.tsx)
│   ├── unit/ (api.test.ts)
│   └── setup.ts
├── AUDIT_BEFORE.md
├── AUDIT_AFTER.md
├── .env.example
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

---

## ⚡ Quick Start & Development Commands

### 1. Installation
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run Linting (ESLint)
```bash
npm run lint
```

### 4. Run Test Suite (Vitest)
```bash
npm run test
```

### 5. Build for Production
```bash
npm run build
```

---

## 👤 Demo Authentication Accounts

You can switch between any of the following pre-configured personas directly from the Top Navigation bar role simulator:

| Role | Demo User Name | Badge Number | Permissions Scope |
|------|----------------|--------------|-------------------|
| **INVESTIGATOR** | Inspector Rajesh Varma | `SCB-8849` | Case management, evidence upload, entity resolution |
| **ANALYST** | Dr. Priya Sundaram | `CNIU-2210` | Network graph topology analysis, AI RAG queries, report generation |
| **SUPERVISOR** | Superintendent K. S. Rao | `DIS-0012` | High-level dashboard reviews, audit log inspection |
| **ADMIN** | System Administrator | `ADMIN-0001` | System settings, security permissions matrix, audit oversight |

---

## 🔌 Future Backend Integration Architecture

The service layer (`src/services/api.ts`) is designed with clean async interface abstractions (`Promise<T>`) so that local mock data stores can easily be replaced by real backend REST APIs or GraphQL services:

- **`authService`** &rarr; OAuth2 / OIDC JWT Token Endpoint
- **`caseService` & `evidenceService`** &rarr; PostgreSQL / S3 Blob Storage API
- **`networkService`** &rarr; Neo4j / Amazon Neptune Graph Database
- **`intelligenceService`** &rarr; Python FastAPI LangChain / LlamaIndex LLM Service
- **`auditService`** &rarr; Write-Once Read-Many (WORM) Security Audit Ledger