# Phase 0 — Full Repository Audit (Before Implementation)

**Project Name:** CRIMENEXUS  
**Purpose:** Multi-Source Criminal Relationship Discovery & Investigation Assistant  
**Scope:** Frontend Architecture & Production-Quality Mock Service Layer  
**Audit Timestamp:** October 6, 2026  

---

## 1. Current Architecture
- **Framework & Runtime:** React 19 (`react` ^19.0.0, `react-dom` ^19.0.0) powered by Vite 6.1.0 (`vite` ^6.1.0) and TypeScript 5.7.3 (`typescript` ^5.7.3).
- **Routing:** React Router DOM v7 (`react-router-dom` ^7.2.0) with nested protected routes (`AppLayout` + `ProtectedRoute`).
- **State Management:** 
  - `zustand` (v5.0.3) for client UI state (theme, sidebar, notifications, global search) and authentication/RBAC state (`useAuthStore`).
  - `@tanstack/react-query` (v5.66.0) for async server-like state caching and data fetching.
- **Service Layer Abstraction:** In-memory mock service (`src/services/api.ts`) wrapping `MockDataStore` and static dataset (`src/services/mockData.ts`).
- **Data Visualization & Graphing:**
  - `cytoscape` (v3.30.4) with `cytoscape-dagre` and `cytoscape-fcose` for network graph rendering.
  - `maplibre-gl` (v5.1.0) for spatial map intelligence visualization.
  - `recharts` (v2.15.1) for dashboard metrics and analytical charts.
- **Styling & UI Components:** Tailwind CSS v3 (`tailwindcss` ^3.4.17), `clsx`, `tailwind-merge`, and custom shadcn/ui-inspired primitives (`Button`, `Input`, `Card`, `Modal`, `Badge`).

---

## 2. Current Project Structure

```
CRIMENEXUS/
├── .git/
├── dist/
├── node_modules/
├── src/
│   ├── app/
│   │   └── AppLayout.tsx
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
│   ├── types/ (index.ts, declarations.d.ts)
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
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── playwright.config.ts
├── postcss.config.js
├── README.md
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 3. Current Dependencies & Package Audit

### Production Dependencies (`dependencies`):
- `@hookform/resolvers` (^3.10.0), `react-hook-form` (^7.54.2), `zod` (^3.24.2)
- `@tanstack/react-query` (^5.66.0), `@tanstack/react-table` (^8.21.2)
- `axios` (^1.8.1)
- `clsx` (^2.1.1), `tailwind-merge` (^3.0.1)
- `cytoscape` (^3.30.4), `cytoscape-dagre` (^2.5.0), `cytoscape-fcose` (^2.2.0)
- `lucide-react` (^0.475.0)
- `maplibre-gl` (^5.1.0)
- `react` (^19.0.0), `react-dom` (^19.0.0), `react-router-dom` (^7.2.0)
- `recharts` (^2.15.1)
- `zustand` (^5.0.3)

### Development Dependencies (`devDependencies`):
- Vitest 3.0.5 (`vitest`), React Testing Library (`@testing-library/react`), Playwright (`@playwright/test`), JSDOM (`jsdom`)
- ESLint 9.20.1 (`eslint`), TypeScript 5.7.3 (`typescript`), Tailwind CSS (`tailwindcss`)

---

## 4. Feature Implementation & Readiness Status

### Implemented Features:
1. **Mock Authentication & Role-Based Access Control (RBAC):** Supports 4 roles (`INVESTIGATOR`, `ANALYST`, `SUPERVISOR`, `ADMIN`) with role-switching capability in `TopNav`.
2. **Global Navigation & Shell:** Sticky `TopNav` with breadcrumbs, theme toggle (dark/light), notifications menu, role simulator, and shortcut-driven global search modal (`/`).
3. **Core Datasets:** Centralized mock dataset (`MOCK_CASES`, `MOCK_ENTITIES`, `MOCK_EVIDENCE`, `MOCK_RELATIONSHIPS`, `MOCK_TIMELINE_EVENTS`, `MOCK_MAP_LOCATIONS`, `MOCK_AI_FINDINGS`, `MOCK_REPORTS`, `MOCK_AUDIT_LOGS`).
4. **Network Graph:** Cytoscape.js implementation showing interactive nodes and edges for cases.
5. **Testing Suite:** Vitest unit/integration tests (`api.test.ts`, `auth.test.tsx`) passing cleanly.

### Partially Implemented & Deficient Features:
1. **Network Graph:** Missing graph filtering by relationship type, entity confidence sliders, neighbor expand/collapse controls, edge detail panel, and reset/fit view actions.
2. **Audit Logging:** Logs are added in memory during runtime but reset upon page reload due to lack of `localStorage` persistence.
3. **Entity Resolution:** Merging entities works in memory, but fails to write audit events to localStorage, and lacks detailed match score breakdowns.
4. **AI Assistant:** Responds deterministically, but evidence links do not open full evidence viewer modals or navigate cleanly with pre-selected filters.
5. **Map Intelligence:** MapLibre canvas needs graceful fallback container if WebGL is unavailable or fails to render in test environments.
6. **Reports:** Generates reports in state, but lacks printable clean layout view for browser printing and export.
7. **Settings Page:** UI placeholders exist, but lack form state persistence and RBAC feature flag controls.

---

## 5. Detailed Problem Identification

- **TypeScript / ESLint Problems:** 33 ESLint warnings reported regarding unused imports (`Users2`, `Clock`, `Filter`, etc.) and implicit `any` types in `CaseDetailPage.tsx` and `NetworkGraphPage.tsx`. `noUnusedLocals` disabled in `tsconfig.app.json`.
- **UI/UX & Responsiveness Problems:** Missing skeleton loading placeholders for heavy graph rendering; table columns overflow on mobile screens without scroll wrappers.
- **Accessibility Problems:** Focus outline rings missing on custom modal close buttons and card links; low contrast text in dark mode for secondary badges.
- **Performance Problems:** Vite build emits a warning due to a single 2.7MB chunk containing Cytoscape, MapLibre, and Recharts. Manual chunk splitting is required in `vite.config.ts`.
- **Git Status Anomaly:** Staged/untracked git status shows deleted files in old sub-directory `criminal-network-intelligence/`. Working tree must be cleaned and updated properly.

---

## 6. Comprehensive Audit Table

| Area | Current State | Problems | Required Improvement | Priority |
|------|---------------|----------|----------------------|----------|
| **Architecture & Structure** | Feature-based directory under `src/` | Some orphaned files in deleted git subfolder references | Re-organize strictly into clean feature folders (`src/app/`, `src/features/`, `src/services/`, etc.) | High |
| **Dependencies** | Modern React 19 + Vite 6 + Cytoscape + MapLibre | Large monolithic bundle size (2.7MB) | Add Rollup `manualChunks` configuration in `vite.config.ts` | High |
| **Authentication & RBAC** | In-memory role simulator | Session lost on page reload | Add `localStorage` persistence for active user & role session | High |
| **Network Graph (Hero)** | Basic Cytoscape rendering | Lacks node/edge filters, edge side panel, neighbor expansion, graph export | Implement complete controls, filters, legend, and detailed edge inspector | Critical |
| **Entity Resolution** | In-memory candidate match cards | Action does not persist audit logs or save state to localStorage | Connect confirmation/rejection directly to audit log persistence service | High |
| **AI Intelligence** | Deterministic mock service | Responses lack interactive evidence drawer and disclaimer formatting | Enhance AI assistant UI with grounded evidence links & legal disclaimer | High |
| **Map Intelligence** | MapLibre canvas integration | Canvas fails gracefully if WebGL context missing; static markers | Add fallback interactive map view, marker details drawer, and location filters | Medium |
| **Audit Logs** | Memory store | Logs reset on browser refresh | Persist audit logs to `localStorage` mock store | High |
| **Reports** | Screen layout only | No export/print format | Add clean print preview & printable CSS mode | Medium |
| **TypeScript & Linting** | 33 ESLint warnings, loose tsconfig | Unused variables & implicit `any` present | Fix all 33 ESLint warnings, set strict type checking | High |
| **Testing** | 7 passing unit/integration tests | Lacks full test coverage for graph data transformer and entity resolution | Add comprehensive Vitest unit tests for graph transformer & resolution | High |
| **Documentation** | Minimal 12-byte README | Missing feature guide, architecture diagram, setup commands, security notes | Rewrite README.md comprehensively | High |

---

## 7. Production-Readiness Assessment

The application currently has a solid foundation with React 19, TypeScript, Cytoscape, and a clean mock service abstraction. However, it requires structural refinement, complete graph interaction controls, audit persistence, ESLint cleanup, bundle optimization, and thorough documentation to be considered a **production-quality frontend architecture with synthetic/mock data and backend-ready service abstractions**.
