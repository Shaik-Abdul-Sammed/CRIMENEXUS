# CRIMENEXUS: Comprehensive Page-by-Page Audit

**Audit Date:** November 2026  
**Auditor:** QA Engineering Lead, Senior Product Manager & UI/UX Architect  
**Scope:** Frontend Architecture, Visual Layouts, API Integrity, Data Flow, and Accessibility (WCAG 2.1 AA)

---

## 1. Dashboard
**File:** `src/features/dashboard/DashboardPage.tsx`  
**Current State:**  
The dashboard provides a high-level operational overview including the Investigation Assistance Mandate disclaimer, case summary metrics, financial tripwire smurfing alert with statutory Section 102 CrPC freeze workflow, court-ready PDF dossier exporter, Live Ingestion streaming monitor, and Remand/Bail statutory clock. While recent fixes resolved container overflow on the mandate banner and added the Show/Hide dashboard toggle, significant gaps remain: the dossier export uses hardcoded fallback case parameters, the freeze action performs only an in-memory client simulation without persistent backend dispatch, charts lack responsive container breakpoints for smaller station screens, and modal dialogs lack strict accessibility focus traps.

### 15 Improvements:
1. **[Bug]** Dynamic Case Number in PDF Export: `handleDownloadDossier` hardcodes `FIR-2026-CRIME-890` and officer `Inspector V. K. Sharma` instead of reading the active target case from `useAppStore()`.
2. **[Bug]** Replace Blocking Native Alerts: In `handleDownloadDossier`, network failures invoke `alert(...)` which freezes the browser thread; replace with non-blocking toast notifications.
3. **[Bug]** Hardcoded Account Binding in Tripwire Alert: `setTripwireAlert` statically sets `account: 'ACC-HDFC-908122'` regardless of which account was flagged by the backend `/analytics/smurfing` response.
4. **[Bug]** Persistent Statutory Freeze API Dispatch: `handleConfirmFreeze` runs a local `setTimeout` timer without issuing a POST request to `/api/v1/legal/freeze`, leaving the freeze record purely client-side and lost on page reload.
5. **[Feature]** Temporal Date-Range Filter: Add a global temporal filter (Last 24 Hours, 7 Days, 30 Days, Entire Investigation) to filter case KPIs and ingestion stats dynamically.
6. **[Feature]** Live Ingestion Stream Controls: Add Pause/Resume streaming playback controls and a rate-limiting slider to the Live Ingestion Streaming Monitor card.
7. **[Feature]** Remand Clock Deep-Linking: Add direct navigation links on accused suspects in the Remand Deadlines widget pointing directly to their detailed custody records and bail petitions.
8. **[Feature]** Dashboard KPI Export: Add an "Export Executive Summary" button to export all dashboard statistics as CSV/PDF for morning police commissioner briefings.
9. **[Feature]** Target Case Quick-Search: Add an inline filter/search input within the bottom "Active Target Cases" card to quickly filter cases by station or crime type.
10. **[UI/UX]** Responsive Recharts Breakpoints: Recharts Pie and Bar charts use fixed height containers that cause label overlap on tablet screens (<768px); configure dynamic aspect ratios and responsive font scaling.
11. **[UI/UX]** Minimal State Placeholder for Hidden Dashboard: When `showDashboard` is false, provide a clean collapsed state card with key indicators and a 1-click "Expand Overview" banner.
12. **[UI/UX]** Skeleton Loaders for Metric Cards: Replace initial 0 values with pulsing skeleton placeholder cards while React Query hooks (`useInvestigations`, `useEntities`) are in flight.
13. **[A11y]** Accessible Metric Regions: Wrap KPI metric cards in `<section>` or `<div role="region">` with descriptive `aria-label`s for screen reader landmark navigation.
14. **[A11y]** Data Visualization Screen-Reader Fallbacks: Supply hidden data tables (`sr-only`) or `aria-label` descriptions summarizing the Pie and Bar charts for visually impaired officers.
15. **[A11y]** Strict Modal Focus Trapping: Implement keyboard focus traps on the Statutory Freeze Modal and Freeze Order Notice modal to prevent focus leaking into background elements.

---

## 2. Network Graph
**File:** `src/features/graph/NetworkGraphPage.tsx`  
**Current State:**  
The network graph implements an interactive Cytoscape.js canvas with support for multiple layouts (`cose`, `fcose`, `dagre`, `circle`, `concentric`, `grid`), entity type filtering, confidence threshold filtering, node and edge inspectors, and PNG export. However, the graph resets user zoom and pan on filter changes, neighbor expansion is currently mocked locally without live backend multi-hop queries, the canvas height is fixed causing clipping on standard laptop displays, the tactical legend panel overlaps nodes in the lower-left corner, and keyboard navigation is absent.

### 15 Improvements:
1. **[Bug]** Preserve Viewport on Filter Update: Rebuilding Cytoscape elements when filters or layouts change resets the viewport; cache and restore current pan position and zoom scale.
2. **[Bug]** Live Backend Neighbor Expansion: `handleExpandNeighbors` filters local state rather than dispatching a multi-hop traversal request to `/api/v1/network/expand/{nodeId}`.
3. **[Bug]** Unintended Background Deselection: Clicking to pan canvas occasionally registers as a canvas click, deselecting the current inspector panel; implement a click-versus-drag delta threshold.
4. **[Bug]** Dynamic Viewport Height: The canvas container has a hardcoded height `h-[650px]`, which overflows small screens (768p/800p) and underutilizes 1440p+ displays; convert to flex dynamic height (`h-[calc(100vh-220px)]`).
5. **[Feature]** Community / Syndicate Clustering: Integrate Louvain or markov clustering algorithms with visual convex hulls to group co-conspirators into identified sub-gangs.
6. **[Feature]** Shortest Path / Conduit Pathfinder: Add a dual-node selector to compute and highlight the shortest hawala money laundering or communication chain between two suspects.
7. **[Feature]** Temporal Crime Evolution Slider: Add a timeline playback bar to animate the creation of graph nodes and transactions week-by-week.
8. **[Feature]** High-DPI Court Evidence PNG Export: Provide 2x/4x resolution options on PNG export, embedding official cryptographic SHA-256 hash watermarks and case metadata.
9. **[Feature]** Multi-Select Lasso / Box Selection: Enable shift-drag or lasso selection to inspect, group, or export multiple entities at once.
10. **[UI/UX]** Collapsible & Draggable Tactical Legend: Convert the fixed bottom-left legend into a collapsible accordion panel so it does not obstruct graph nodes.
11. **[UI/UX]** Long Label Ellipsis & Hover Tooltips: Improve handling of long Indian suspect names (e.g. >25 characters) to prevent text clipping and overlapping edge endpoints.
12. **[UI/UX]** Empty State for Over-Filtered Graph: Display a user-friendly empty state illustration with a "Reset Filters" CTA when confidence slider filters out all visible nodes.
13. **[A11y]** Keyboard Canvas Navigation: Support standard pan and zoom via keyboard arrow keys (`ArrowUp`, `ArrowDown`, `+`, `-`) and Tab-key navigation across nodes.
14. **[A11y]** Screen Reader Inspector Announcements: Add an `aria-live="polite"` status region that announces the name, type, and risk score whenever a node or relationship is selected.
15. **[A11y]** Edge Contrast Conformance: Increase contrast ratio on dashed communication edges (`#64748B`) against dark canvas backgrounds (`#020617`) to meet WCAG AA standards.

---

## 3. Map Intelligence
**File:** `src/features/map/MapIntelligencePage.tsx`  
**Current State:**  
The map intelligence module integrates MapLibre GL to render geographic crime intelligence across the Delhi NCR region, displaying ANPR vehicle sightings, CDR cell tower pings, police station markers, predictive high-risk patrol zones, and fastest police intercept routing. However, coordinate fallbacks default to Noida even for cases in other jurisdictions, sighting playback timers can leak memory across unmounts, HTML popups construct DOM nodes unsafely, and there is no geofencing drawing tool or alternate satellite layer.

### 15 Improvements:
1. **[Bug]** Context Loss Resilience: MapLibre GL container unmounting during route transitions can trigger WebGL context loss warnings; ensure clean instance termination and canvas cleanup on unmount.
2. **[Bug]** Jurisdiction-Aware Fallback Coordinates: The intercept routing fallback hardcodes Noida coordinates (`[77.5510, 28.1402]`), leading to misleading routes for cases situated in Mumbai, South Delhi, or Hyderabad.
3. **[Bug]** Timer Cleanup on Waypoint Playback: Sighting timeline interval timer lacks strict cancellation ref checking, creating background memory leaks if the user exits mid-animation.
4. **[Bug]** Secure HTML Sanitization for Popups: Marker popups inject HTML strings directly into MapLibre markers; replace with sanitized React DOM portals to prevent DOM-based XSS from telemetry inputs.
5. **[Feature]** Geofencing Polygon / Circle Drawing Tool: Add interactive drawing tools allowing investigators to draw a boundary polygon and query all CDR pings and ANPR hits inside the area.
6. **[Feature]** Heatmap Density Layer Toggle: Add a Kernel Density Estimation (KDE) heatmap layer to visualize historical crime concentration across police sub-divisions.
7. **[Feature]** ANPR CCTV Frame Snapshot Drawer: Integrate actual ANPR camera photographic stills or vehicle license plate crops inside the waypoint details drawer.
8. **[Feature]** Base Map Style Selector: Add layer switcher to toggle between Dark Tactical, High-Contrast Light, OpenStreetMap, and Satellite Imagery modes.
9. **[Feature]** Court-Ready Map Export: Provide an "Export Section 65B Certified Map" action including a statutory graphical scale bar, North arrow, GPS coordinates ledger, and timestamp.
10. **[UI/UX]** Reposition ANPR Alert Overlay: The floating ANPR alert card overlays and obscures top-right navigation zoom controls on tablets; reposition to bottom drawer or slide-in banner.
11. **[UI/UX]** Playback Media Controller: Replace basic timeline slider with a full playback controller with Play/Pause, Step Next/Prev, and 1x/2x/5x speed controls.
12. **[UI/UX]** Police Station Interactive Info Window: Upgrade static circle markers for police posts with station name, SHO name, CCTNS station code, and emergency contact phone links.
13. **[A11y]** Accessible Tabular Alternative: Provide an accessible table view toggle displaying all coordinate waypoints, timestamps, and locations for non-sighted users.
14. **[A11y]** Dual-Coded Risk Zone Symbology: High-risk forecast zones currently rely exclusively on red/orange/yellow shading; add distinct geometric crosshatch patterns and text icons for color-blind accessibility.
15. **[A11y]** Keyboard Control of Map Viewport: Add accessible buttons with visible focus rings for Zoom In, Zoom Out, Reset Bearing, and Center on Incident.

---

## 4. Most Wanted Watchlist
**File:** `src/features/watchlist/MostWantedPage.tsx`  
**Current State:**  
The Most Wanted Watchlist tracks district fugitives and kingpins, ranking them by AI composite risk score and danger levels, with Non-Bailable Warrant tracking, Lookout Circular (LOC) generation, and an Explainable AI (XAI) feature factor drawer rendering SHAP breakdowns. However, the XAI endpoint encodes suspect names rather than canonical IDs, failing requests show no user-facing recovery actions, suspect cards lack pagination, and cards have ragged heights across varying alias lengths.

### 15 Improvements:
1. **[Bug]** Canonical Identifier in XAI URL: `handleToggleXai` queries `/threats/risk-score/{suspectName}` using raw names that fail when aliases contain slashes or brackets; use unique suspect ID (`suspectId`).
2. **[Bug]** User-Facing Error State for XAI Failure: When the risk score API fails, only `console.warn` is triggered; display an inline retry banner with "Failed to load risk attribution".
3. **[Bug]** Suspect Grid Pagination / Virtualization: Rendering all suspect cards without pagination causes DOM bloat; implement 12-per-page pagination or virtualized list.
4. **[Bug]** Broadened Search Indexing: Search query checks only name and alias; expand search indexing to match bounty amount, FIR number, linked vehicle plate, and warrant number.
5. **[Feature]** Legal Warrant Status Filter: Add filter chips for Proclaimed Offender (PO under Sec 82 CrPC), Non-Bailable Warrant (NBW), and Active Lookout Circular (LOC).
6. **[Feature]** Bulk Border Alert Dispatch: Allow selecting multiple fugitives to generate a combined Bureau of Immigration / Airport Authority alert packet.
7. **[Feature]** Biometric / Mugshot Comparison Drawer: Add a biometric facial similarity score display comparing ANPR CCTV captures against stored criminal database photos.
8. **[Feature]** Chain of Custody & Dossier View Audit: Log an automated audit trail whenever an officer inspects or prints a fugitive's dossier.
9. **[Feature]** Public Sighting Tip Submission Form: Add an internal modal for desk officers to log incoming telephone or beat-constable sighting tips against a specific suspect.
10. **[UI/UX]** Standardized Threat Severity Badging: Align danger badges ("EXTREME", "CRITICAL", "HIGH") to unified semantic color tokens across all cards.
11. **[UI/UX]** Uniform Card Heights & Responsive Layout: Use `flex-col justify-between` on cards with `line-clamp-2` on aliases to prevent ragged row heights on wide screens.
12. **[UI/UX]** Persistent LOC Dispatch Notice: Replace fleeting alert with a persistent modal confirmation displaying the official CCTNS Dispatch Reference Number and copy button.
13. **[A11y]** Semantic Progressbars for SHAP Scores: Add `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, and `aria-valuemax="100"` to the XAI attribution bars.
14. **[A11y]** Accessible XAI Accordion Trigger: Convert the XAI toggle container into a semantic `<button>` with `aria-expanded` and `aria-controls`.
15. **[A11y]** Low Contrast Bounty Text: Increase contrast ratio on bounty figures (`text-amber-400/80` against dark gray backgrounds) to meet 4.5:1 WCAG AA standards.

---

## 5. Evidence Vault
**File:** `src/features/evidence/EvidencePage.tsx`  
**Current State:**  
The Evidence Vault manages forensic digital and physical evidence records, including FIR documents, CDR telecom dumps, bank transaction records, CCTV files, and vehicle sightings with SHA-256 integrity verification and bulk zip downloading. However, the evidence upload modal only captures metadata without real file input handling or client-side hash computing, chain of custody logs are non-interactive, search lacks hash and officer badge queries, and CCTV video files have no inline player.

### 15 Improvements:
1. **[Bug]** Real Binary File Ingestion: The upload modal lacks a `<input type="file">` selector, saving only form text strings rather than computing cryptographic hashes on real files.
2. **[Bug]** Client-Side Automated SHA-256 Calculation: Compute the SHA-256 hash in real-time in the browser using the Web Crypto API (`crypto.subtle.digest`) upon file selection before upload.
3. **[Bug]** Case & Hash Search Indexing: Expand search input filtering beyond `title` and `source` to match full SHA-256 hashes, source references, and officer badge numbers.
4. **[Bug]** Error Handling on Bundle Download: If evidence bundle generation fails on the backend, replace the generic alert with an actionable message detailing missing attachments.
5. **[Feature]** Video Transcoding & Inline Forensic Player: Add an integrated H.264/MP4 video player with frame-by-frame forward/reverse for CCTV surveillance clips.
6. **[Feature]** Individual Section 63 BSA Certificate Generator: Add a 1-click button on each evidence card to download a standalone Section 63 BSA / 65B IEA digital evidence certificate.
7. **[Feature]** Drag-and-Drop Batch Ingestion: Support multi-file drag-and-drop to ingest batches of telecom CDR sheets or seizure memos with batch progress bars.
8. **[Feature]** Independent Hash Verifier Utility: Add a "Verify File Integrity" dropzone where an officer can drag any file to verify if its checksum matches the vault record.
9. **[Feature]** Evidence Vault Pagination: Implement pagination and items-per-page controls (10, 25, 50) for investigations containing hundreds of evidence artifacts.
10. **[UI/UX]** One-Click Hash Copy Button: Add a dedicated copy button next to the truncated SHA-256 hash string on each card with visual feedback.
11. **[UI/UX]** Visual Media Thumbnails: Display visual thumbnail placeholders for image, video, and audio evidence cards instead of generic document icons.
12. **[UI/UX]** Responsive Filter Toolbar: Wrap filter controls cleanly using responsive flex layout so that the search bar does not shrink on medium screens.
13. **[A11y]** Non-Text Icon Decoration: Mark purely decorative icons with `aria-hidden="true"` so screen readers do not announce redundant names.
14. **[A11y]** Upload Modal Focus Containment: Implement focus trapping and autofocus on the first input when the "Upload Evidence" modal opens.
15. **[A11y]** Dual-Coded Chain of Custody Badges: Supplement color-coded custody badges (Verified, Under Review, Tamper Suspected) with unambiguous text and icons.

---

## 6. Cases & Investigations
**Files:** `src/features/cases/CasesPage.tsx` and `src/features/cases/CaseDetailPage.tsx`  
**Current State:**  
The investigations module provides a central case repository with priority badges, status filters, voice dictation for case narratives, and a detail view featuring tabbed sections (Overview, Timeline, Evidence, Entities, Graph). Key regressions include: the detail view's embedded graph lacks full navigation controls, the Witness Summarizer does not save its outputs to the database, search parameters are lost on page refresh, and statutory remand/charge sheet countdowns are absent from the cases list.

### 15 Improvements:
1. **[Bug]** Embedded Graph Toolbar Parity: The "GRAPH" tab in `CaseDetailPage.tsx` mounts a bare Cytoscape canvas without zoom controls, export options, or layout switchers; align with `NetworkGraphPage`.
2. **[Bug]** Witness Summary Persistence: `WitnessSummarizerModal` generates AI text locally but fails to persist the summary into the case's evidence log or PostgreSQL database.
3. **[Bug]** URL Query Parameter Sync: Sync search term and status filter in `CasesPage.tsx` to URL query params (`?search=...&status=...`) so filters persist across page reloads.
4. **[Bug]** Speech Recognition Fallback: `useSpeechRecognition` fails silently in browsers without `webkitSpeechRecognition` support (Firefox/Safari); display a tooltip explaining browser compatibility.
5. **[Feature]** Case Transfer & Reassignment Workflow: Add a modal allowing supervisors to formally reassign a case to another Investigating Officer with transfer memo logging.
6. **[Feature]** Statutory Charge-Sheet Countdown Badge: Add a visual 60/90-day countdown badge to each case card warning of approaching default bail deadlines under Sec 167 CrPC / Sec 187 BNSS.
7. **[Feature]** CCTNS Standard XML/JSON Export: Add an export feature producing CCTNS-compliant National Crime Records Bureau (NCRB) interchange format files.
8. **[Feature]** Sealed / Sensitive Case Protection: Add confidentiality tags (e.g. POCSO, NDPS, National Security) that blur complainant names until explicitly revealed by authorized supervisors.
9. **[Feature]** Batch Case Status Actions: Provide checkboxes on case cards to allow supervisors to mark multiple cases as "CHARGESHEET_FILED" or "CLOSED" in bulk.
10. **[UI/UX]** Button Asynchronous Loading Feedback: Add spinning indicators on "View Dossier" and "Download Bundle" buttons during network fetch.
11. **[UI/UX]** Timeline Zoom & Date Grouping: Add zoom and grouping controls (By Month, By Week, By Day) to the Visual Case Timeline to prevent excessive vertical scrolling on complex cases.
12. **[UI/UX]** Styled Empty States on Detail Tabs: Provide clean empty states with direct "Add Evidence" or "Link Entity" actions when overview tabs contain 0 items.
13. **[A11y]** WAI-ARIA Tabs Compliance: Refactor case detail tab buttons to use standard WAI-ARIA tab semantics (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`).
14. **[A11y]** Voice Dictation Accessible State: Add `aria-pressed="true|false"` and an `aria-live` announcement when voice dictation starts and stops.
15. **[A11y]** Priority Badge Contrast: Enhance foreground/background contrast on CRITICAL and HIGH priority badges to ensure readability in dark and light modes.

---

## 7. Legal Drafting
**File:** `src/features/drafting/DraftingPage.tsx`  
**Current State:**  
The Legal Drafting workbench leverages an AI RAG abstraction to generate court-admissible legal documents across four statutory formats: FIRs, Final Charge Sheets, Section 102 CrPC Bank Freezing Notices, and Lookout Circulars (LOCs). While functional, the page resets generated output when toggling between tabs, lacks vital statutory fields in the bank notice form (such as IFSC and branch codes), provides no bilingual output (English/Hindi), and displays a single generic spinner during Ollama inference without step-by-step progress.

### 15 Improvements:
1. **[Bug]** Preserved State Across Tabs: Toggling between tabs (`FIR`, `CHARGE_SHEET`, `BANK_NOTICE`, `LOC`) clears the active draft; maintain independent state for each tab so drafts are not wiped out.
2. **[Bug]** Rich-Text Paragraph Formatting: Fallback draft strings contain literal `\n` characters that do not display cleanly; render output with proper markdown formatting.
3. **[Bug]** Statutory Compliance Fields for Bank Notices: The bank notice form only requests Account Number and Bank Name; add mandatory statutory fields: IFSC code, Branch Address, and Suspect Pan/Aadhaar.
4. **[Bug]** Drafting Error Boundary: Wrap the draft preview window in an Error Boundary to prevent crashes if the RAG backend returns unexpected schema formatting.
5. **[Feature]** LLM Backend & Model Switcher: Add a model selector dropdown allowing investigators to switch between local Ollama models (Gemma-2B, Llama-3-8B, Mistral-7B).
6. **[Feature]** Drafting Temperature & Formality Slider: Allow officers to select draft tone (Concise Field Summary vs Exhaustive Court Formality).
7. **[Feature]** Bilingual Hindi/English Dual Generation: Add a toggle to generate court drafts in bilingual parallel columns (English alongside Hindi / Marathi / Kannada / Telugu).
8. **[Feature]** Export to Editable Word Document (.docx): In addition to plain text, support exporting drafts directly to formatted `.docx` and `.pdf` files with official police letterheads.
9. **[Feature]** Draft Version History & Diff Viewer: Add a revision tracker showing edits made by the IO between AI generation and final submission.
10. **[UI/UX]** Multi-Stage Generation Progress: Replace static spinner with progress milestones during Ollama generation ("1. Parsing FIR narrative...", "2. Correlating statutory BNS/PMLA sections...", "3. Generating court-ready document...").
11. **[UI/UX]** Narrative Character Counter & Prompt Hints: Add a character counter and helper prompt suggestions to guide officers in entering detailed, legally sound narratives.
12. **[UI/UX]** Full-Screen Drafting Preview Mode: Provide an expand/full-screen button on the preview pane to facilitate comfortable reading and editing of long 15-page charge sheets.
13. **[A11y]** Keyboard Arrow Navigation on Drafting Tabs: Implement left/right arrow key navigation across tab triggers per W3C ARIA tab pattern specifications.
14. **[A11y]** Screen Reader Copy Feedback: Announce "Legal draft copied to clipboard" via an `aria-live="polite"` container rather than relying solely on visual checkmark changes.
15. **[A11y]** Form Input Label Associations: Ensure all textarea and input fields have explicit `<label>` tags with matching `htmlFor` attributes.

---

## 8. AI Investigation Assistant
**File:** `src/features/assistant/AIAssistantPage.tsx`  
**Current State:**  
The AI Assistant page provides natural language investigative query capabilities with preset prompts, returning findings backed by evidence references and linked entities. However, the interface renders findings as a static list rather than a conversational multi-turn chat, case context is hardcoded to `'case-101'`, clicking preset prompts submits queries immediately without allowing user edits, and there are no citation preview hovercards or voice playback controls.

### 15 Improvements:
1. **[Bug]** Dynamic Case Context Binding: `handleSendQuery` hardcodes `caseId: 'case-101'` instead of using the globally active target case from `useAppStore()`.
2. **[Bug]** Conversational Multi-Turn Chat Thread: Findings are currently rendered as a global flat list; convert to a conversational multi-turn thread with investigator prompts and assistant responses.
3. **[Bug]** Actionable Empty & Failure States: If the RAG query yields no grounded matches, provide helpful query reformulation tips rather than an empty screen.
4. **[Bug]** Editable Preset Query Injection: Clicking a suggested query currently dispatches it immediately; allow it to populate the input box so officers can customize suspect names.
5. **[Feature]** Conversational Session Memory: Maintain chat history across queries so investigators can ask contextual follow-up questions ("What other vehicles did that suspect own?").
6. **[Feature]** Hoverable Evidence Citation Previews: Hovering over an evidence chip (e.g. `EV-901`) should display a hovercard previewing the document excerpt and SHA-256 hash.
7. **[Feature]** Investigatory Accuracy Feedback (RLHF): Add Thumbs Up / Thumbs Down feedback buttons on each AI finding to record analytical accuracy for model evaluation.
8. **[Feature]** Export AI Investigation Brief: Add a 1-click action to compile the current AI dialogue and grounded evidence links into an executive PDF briefing.
9. **[Feature]** Voice Input (STT) and Audio Readout (TTS): Integrate voice dictation for prompt entry and audio text-to-speech readout for field briefings.
10. **[UI/UX]** Chat-Style Fixed Bottom Input Bar: Move the prompt input box to a fixed bottom docking bar standard in modern intelligence chat interfaces.
11. **[UI/UX]** Chronological Timeline Separators: Organize findings with clear date and timestamp dividers ("Today", "Yesterday", "28 October 2026").
12. **[UI/UX]** Evidence Type Icons in References: Display distinct icons (CCTV, Bank, Telecom) next to grounded evidence reference chips for rapid visual identification.
13. **[A11y]** Screen Reader Live Region for Streaming Responses: Mark the assistant output container with `aria-live="polite"` and `aria-busy="true|false"` during inference.
14. **[A11y]** Touch Target Minimums on Query Chips: Increase padding and height on suggested query chips to ensure they satisfy the minimum 44x44px touch target requirement.
15. **[A11y]** Accessible Contrast on Mandate Banner: Increase contrast on the disclaimer card (`text-amber-300` on `bg-amber-500/10`) to comply with 4.5:1 WCAG AA standards in light mode.

---

## 9. Global Navigation & Sidebar
**Files:** `src/components/layout/Sidebar.tsx` and `src/components/layout/TopNav.tsx`  
**Current State:**  
The global navigation layout comprises a sticky top bar and collapsible sidebar. Recent updates added active route highlighting, smooth vertical scrolling for long link lists, and multi-language support (English, Hindi, Marathi, Kannada, Telugu). However, language switching leaves several downstream views in English, changing roles does not enforce RBAC route restrictions, breadcrumbs render raw case slugs, the notification bell lacks an unread badge counter, and collapsed sidebar buttons lack tooltips.

### 15 Improvements:
1. **[Bug]** Downstream Vernacular Translation Gaps: While top navigation links are translated, multiple major page components (`EvidencePage`, `MostWantedPage`, `MapIntelligencePage`) contain hardcoded English strings.
2. **[Bug]** Role-Based Access Control (RBAC) Route Guards: Switching active roles in TopNav updates the visual badge but fails to restrict unauthorized routes (e.g., non-admin access to Audit Logs).
3. **[Bug]** Unconfirmed Logout Action: Clicking logout in the sidebar immediately clears user session tokens without a confirmation dialog.
4. **[Bug]** Human-Readable Breadcrumbs: TopNav breadcrumbs format raw URL slugs (e.g. `Home > Cases > Case 101`); map technical IDs to descriptive names (e.g. `FIR-2026-DEL-8902`).
5. **[Feature]** Unread Notification Badge Counter: Add an active numeric badge counter to the TopNav notification bell that reflects unread critical tripwires and remand deadlines.
6. **[Feature]** Global Keyboard Shortcuts Modal: Add a hotkey modal triggered by `?` or `Cmd+K` detailing all navigation and action shortcuts.
7. **[Feature]** Recent Investigations Quick-Switcher: Add a "Recently Viewed Cases" history dropdown to TopNav for fast navigation between active dossiers.
8. **[Feature]** Offline Network Status Indicator: Display a prominent banner or indicator pill in TopNav when network connectivity is lost.
9. **[Feature]** In-App Police Feedback / Defect Reporter: Add a quick feedback button allowing field officers to report UI glitches or data mismatches with automated screenshots.
10. **[UI/UX]** Tooltips for Collapsed Sidebar: When sidebar is collapsed to icon-only mode (`w-20`), render hover tooltips on each navigation item.
11. **[UI/UX]** Enhanced Global Command Palette: Upgrade the `/` search launcher to support keyboard arrow navigation, recent searches, and deep indexing across CDRs and ANPR hits.
12. **[UI/UX]** Status Badges in Sidebar Case Dropdown: Display priority badges (e.g. "CRITICAL", "OPEN") alongside case numbers in the Active Target Case selector.
13. **[A11y]** Accessible Sidebar Toggle State: Add `aria-expanded` and `aria-controls="sidebar-navigation"` attributes to the sidebar collapse button.
14. **[A11y]** Escape Key Handling on Dropdown Menus: Ensure the notification, role, and language dropdown menus close automatically upon pressing the `Escape` key.
15. **[A11y]** Semantic Breadcrumb Structure: Refactor breadcrumb markup in `TopNav.tsx` to use `<nav aria-label="Breadcrumb">` containing an ordered list (`<ol>`).

---

## 10. Lite Mode (Low-Bandwidth Thana Interface)
**File:** `src/features/lightweight/LightweightDashboard.tsx`  
**Current State:**  
Lite Mode is engineered for rural police stations with constrained 2 Mbps broadband links, eliminating heavy WebGL canvases (MapLibre) and complex graph engines (Cytoscape) in favor of fast, accessible HTML tables and offline `localStorage` caching. However, currently only the Most Wanted table fetches live backend data while smurfing alerts and FIR summaries are static mock constants, tables lack horizontal scrolling on low-resolution 1024x768 police monitors, and there are no pagination or search capabilities.

### 15 Improvements:
1. **[Bug]** Live Backend Sync for Alerts and FIRs: Only Most Wanted records are fetched from `/api/v1/threats/most-wanted`; Smurfing Alerts and FIR Summaries are static mock arrays (`DEFAULT_ALERTS`, `DEFAULT_FIRS`) and never query the backend.
2. **[Bug]** Robust LocalStorage Error Handling: If `localStorage` is disabled or exceeds storage quota, wrap writes in resilient `try/catch` blocks to prevent unhandled script exceptions.
3. **[Bug]** Responsive Table Overflow Container: Wrap all table elements in `<div className="overflow-x-auto">` to prevent table cells from clipping on legacy 1024x768 station monitors.
4. **[Bug]** Dynamic Station Terminal Cache Timestamp: Correct fallback logic so the cache timestamp reflects real local dates rather than defaulting permanently to "Station Terminal Pre-seed".
5. **[Feature]** Lite Mode Table Pagination: Add simple, fast pagination controls (Previous / Next, 10 records per page) for rural stations handling hundreds of records.
6. **[Feature]** Quick Filter / Search Bar: Add a lightweight, instantaneous client-side filter input to search suspects by phone number, plate, or FIR number.
7. **[Feature]** Dot-Matrix & Thermal Printer Friendly Mode: Add a "Print Text Sheet" button that formats tables in monochrome, zero-background CSS for thermal or dot-matrix police station printers.
8. **[Feature]** Manual Sync / Reconnect Button: Add a dedicated "Force Sync Data Now" button allowing officers to retry network connections without reloading the entire browser tab.
9. **[Feature]** SMS / Plaintext Sighting Dispatcher: Add a 1-click action to format fugitive details into compact plaintext suitable for transmission via police SMS gateway or wireless radio.
10. **[UI/UX]** High-Visibility Offline Status Banner: Replace small offline badge with a prominent top status banner when connectivity drops during an active shift.
11. **[UI/UX]** Click-to-Call and Copy Formatting: Render phone numbers as clickable `tel:` links and add one-click copy buttons for bank account and vehicle registration numbers.
12. **[UI/UX]** High-Contrast Badge Text: Use high-contrast solid badges for status indicators (PROCLAIMED OFFENDER, ACTIVE WARRANT) to ensure legibility on dim, uncalibrated monitors.
13. **[A11y]** Accessible Table Semantics: Add descriptive `<caption>` elements and `scope="col"` attributes to all table headers for screen reader navigation.
14. **[A11y]** Skip Links for Table Navigation: Provide an accessible skip-link at the top of the page allowing keyboard users to jump directly to the Most Wanted or FIR table.
15. **[A11y]** Ultra High-Contrast Theme Toggle: Provide a 1-click toggle for an ultra-high contrast black-and-white theme for officers operating in bright outdoor or low-light conditions.

---

## Summary Matrix of Audited Areas

| # | Page / Module | File Path | Critical Bugs Identified | Key Feature Gaps | Accessibility Gaps |
|---|---------------|-----------|--------------------------|------------------|--------------------|
| 1 | **Dashboard** | `src/features/dashboard/DashboardPage.tsx` | Static dossier export parameters, simulated freeze | No date filter, no pause stream | Missing modal focus traps, no chart tables |
| 2 | **Network Graph** | `src/features/graph/NetworkGraphPage.tsx` | Viewport resets on filter, local expansion mock | No clustering, no pathfinder | Canvas lacks keyboard pan/zoom, edge contrast |
| 3 | **Map Intelligence** | `src/features/map/MapIntelligencePage.tsx` | Fallback coordinates hardcoded to Noida, popup XSS | No polygon geofence, no satellite mode | Lacks table alternative, color-only risk zones |
| 4 | **Most Wanted** | `src/features/watchlist/MostWantedPage.tsx` | XAI URL encodes names, no recovery on failure | No warrant status filter, no pagination | Non-semantic XAI accordion, contrast issues |
| 5 | **Evidence Vault** | `src/features/evidence/EvidencePage.tsx` | Upload lacks `<input type="file">`, text-only hashes | No DVR video player, no batch upload | Modal focus leak, color-only custody tags |
| 6 | **Cases Workspace** | `src/features/cases/CasesPage.tsx` & Detail | Embedded graph lacks controls, summarizer unpersisted | No case transfer, no Sec 167 countdown | Detail tabs lack WAI-ARIA roles, voice state |
| 7 | **Legal Drafting** | `src/features/drafting/DraftingPage.tsx` | Tab switch clears draft, missing statutory bank fields | No model selector, no bilingual Hindi | Tabs lack arrow navigation, no aria-live on copy |
| 8 | **AI Assistant** | `src/features/assistant/AIAssistantPage.tsx` | Hardcoded case-101, non-conversational flat list | No session memory, no citation preview | Missing aria-live streaming, small touch chips |
| 9 | **Global Navigation** | `Sidebar.tsx` & `TopNav.tsx` | Downstream translation gaps, RBAC not enforced | No unread notification count, no hotkey guide | Missing aria-expanded on toggle, non-semantic breadcrumbs |
| 10 | **Lite Mode** | `LightweightDashboard.tsx` | Alerts and FIRs are hardcoded mock arrays | No pagination, no dot-matrix print | Tables lack captions/scope, no high-contrast toggle |

---
*End of 13_PAGE_BY_PAGE_AUDIT.md*
