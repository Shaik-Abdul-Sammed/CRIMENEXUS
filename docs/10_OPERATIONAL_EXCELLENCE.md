# CRIMENEXUS v3.0: Operational Excellence & Ground Deployment Guide

## Overview

CRIMENEXUS v3.0 shifts focus from conceptual prototypes to **operational honesty, ground resilience, and police station reality**. Under real-world conditions across Indian police stations, network connectivity is variable (BSNL 2 Mbps links), terminals are shared among multiple duty officers, data spoliation defenses must withstand intense cross-examination under the Bharatiya Sakshya Adhiniyam (BSA 2023), and Investigating Officers (IOs) carry severe caseload imbalances.

This guide documents the 10 Operational Excellence features introduced to bridge the gap between technical architecture and police ground deployment.

---

## 1. Multi-Tenant Row-Level Security (RLS)

* **Real Police Problem:** In a state-wide CCTNS or cloud deployment, an IO from Connaught Place must not view sensitive organized crime dossiers or ongoing wiretaps belonging to Crime Branch or an adjacent district without explicit supervisory clearance.
* **Module:** `backend/app/security/rls.py`
* **Test Suite:** `backend/tests/advanced/test_multi_tenant_rls.py`
* **RBAC Hierarchy:**
  * `IO` / `SHO`: Restricted strictly to station jurisdiction (`station_id`).
  * `DSP` / `SP`: District-wide operational oversight (`district_id`).
  * `CID` / `DGP`: State-wide intelligence aggregation (`state_id`).
  * `CBI` / `SUPER_ADMIN`: National multi-agency task force access.
* **API Check:** `GET /api/v1/security/tenancy-check`

---

## 2. Automated Multi-Tier Backup & Disaster Recovery (DR)

* **Real Police Problem:** Station hardware failures, malicious ransomware, or physical seizure of server equipment can destroy court evidence. ISO 27001 BIA and CCTNS guidelines mandate RPO < 24h and RTO < 1h.
* **Module:** `backend/app/services/backup/backup_service.py`
* **Test Suite:** `backend/tests/advanced/test_backup_dr.py`
* **Capabilities:**
  * Synchronous snapshot generation across PostgreSQL relational tables, Neo4j graph nodes/edges, and the WORM Audit Ledger.
  * SHA-256 cryptographic manifest generation.
  * Tamper detection: any bit-level modification on disk fails integrity verification.
  * Automated retention policy pruning with guaranteed minimum retained snapshots.
* **APIs:**
  * `POST /api/v1/admin/backup/trigger`
  * `GET /api/v1/admin/backup/status`

---

## 3. Audit Time-Travel Query Engine

* **Real Police Problem:** During trial, defense counsel often alleges that the police fabricated graph associations after chargesheet filing. The IO must prove precisely what the evidence graph looked like at any historical date $T$.
* **Module:** `backend/app/services/legal/time_travel.py`
* **Test Suite:** `backend/tests/advanced/test_time_travel.py`
* **Legal Compliance:** Section 63 Bharatiya Sakshya Adhiniyam (BSA) / Section 65B Indian Evidence Act.
* **Capabilities:**
  * Reconstructs active entities, relations, and case disposition as of any timestamp.
  * Generates state SHA-256 hash at date $T_1$ and $T_2$.
  * Computes mathematical diff showing evidentiary growth over time.
* **APIs:**
  * `GET /api/v1/legal/time-travel/{case_id}?as_of=...`
  * `GET /api/v1/legal/time-travel/{case_id}/diff?t1=...&t2=...`

---

## 4. Automated Case Aging & Stalled Investigation Alerts

* **Real Police Problem:** Under Section 193 BNSS (formerly Sec 173 CrPC), chargesheets must be filed within 60 or 90 days. In POCSO/rape cases, investigation must conclude within 60 days. Inactive files languish unnoticed in police station record rooms.
* **Module:** `backend/app/services/analytics/case_aging.py`
* **Test Suite:** `backend/tests/advanced/test_case_aging.py`
* **Alert Hierarchy:**
  * `STALLED_LOW` (Age > 60d): 30-day warning before statutory default bail deadline.
  * `STALLED_MEDIUM` (Inactivity > 30d): Inactive case diary alert issued to SHO.
  * `STATUTORY_BREACH_CRITICAL` (Age >= 60d POCSO / >= 90d Heinous): Mandatory SP intervention.
* **API:** `GET /api/v1/analytics/case-aging`

---

## 5. Multi-Jurisdiction Warrant & Look Out Circular (LOC) Tracker

* **Real Police Problem:** Absconding offenders cross state borders. Non-Bailable Warrants (NBWs) and Look Out Circulars (LOCs) with the Bureau of Immigration (BOI) frequently expire unrenewed, allowing fugitives to exit airports.
* **Module:** `backend/app/services/warrants/warrant_tracker.py`
* **Test Suite:** `backend/tests/advanced/test_warrant_tracker.py`
* **Features:**
  * Cross-state registry for NBW, Bailable Warrants, Proclaimed Offenders (Sec 84/85 BNSS), and LOCs.
  * Automated 15-day warning before LOC expiry.
  * Inter-state search by alias, suspect name, or issuing court.
* **APIs:**
  * `POST /api/v1/warrants/register`
  * `GET /api/v1/warrants/search`
  * `POST /api/v1/warrants/{warrant_id}/execute`

---

## 6. Cold Case Resurrection Engine

* **Real Police Problem:** A suspect arrested for armed robbery may have committed an unsolved murder 4 years ago that was closed as "untraced". Physical case files are never systematically cross-matched.
* **Module:** `backend/app/ml_service/cold_case_engine.py`
* **Test Suite:** `backend/tests/advanced/test_cold_case_engine.py`
* **Matching Vector:**
  * Exact/Normalized Entity Hits: Phone numbers, IMEIs, vehicle plates, bank accounts, aliases.
  * Modus Operandi (MO) Similarity: Token Jaccard matching on crime execution descriptions.
  * Reopen Protocol: Generates legal recommendation for production warrant under Sec 294 BNSS.
* **API:** `POST /api/v1/intelligence/cold-case-resurrect`

---

## 7. Officer Workload Balancer

* **Real Police Problem:** Workload maldistribution among Investigating Officers causes investigative failure. Senior Sub-Inspectors are frequently bogged down with 40+ cases, while junior officers carry 4-5.
* **Module:** `backend/app/services/analytics/workload_balancer.py`
* **Test Suite:** `backend/tests/advanced/test_workload_balancer.py`
* **Weighted Load Metrics:**
  * Heinous crimes (Homicide/POCSO): 5 points
  * Serious crimes (Robbery/Extortion): 3 points
  * Economic/Cyber crimes: 2 points
  * Minor offenses: 1 point
  * Active custody remand urgency bonus (+2 points per suspect in remand).
* **APIs:**
  * `GET /api/v1/analytics/workload-distribution/{station_id}`
  * Automated IO recommendation for incoming FIRs.

---

## 8. Real-Time CDR Streaming Fusion (Telecom Gateway Stub)

* **Real Police Problem:** During ongoing kidnappings or active terrorist chases, officers cannot wait 24-48 hours for batch CDR telecom dumps. Lawful interception requires live packet streaming.
* **Module:** `backend/app/services/streaming/telecom_gateway.py`
* **Test Suite:** `backend/tests/advanced/test_cdr_live_stream.py`
* **Capabilities:**
  * Redis Stream topic `telecom.cdr.live` consumer with ring-buffer fallback.
  * Real-time geofence interception (Haversine radius trigger).
  * Automated target phone watchlist alert with cell-tower handover trail reconstruction.
* **APIs:**
  * `POST /api/v1/streaming/cdr/ingest-live`
  * `GET /api/v1/streaming/cdr/live-trail/{phone}`

---

## 9. Biometric Hash Matching (Fingerprint & Face Template Stub)

* **Real Police Problem:** National Automated Fingerprint Identification System (NAFIS) and facial recognition require certified optical readers and MHA VPN clearance. Stations require on-premise template matching without violating the Digital Personal Data Protection (DPDP) Act 2023.
* **Module:** `backend/app/ml_service/biometric_matcher.py`
* **Test Suite:** `backend/tests/advanced/test_biometric_matcher.py`
* **Design & Compliance:**
  * Zero-knowledge SHA-256 template hashing (raw minutiae images are not retained).
  * ISO/IEC 19794-2 minutiae correspondence matcher.
  * 128-dimensional facial embedding cosine similarity matcher.
* **External Blocker Note:** Direct live NAFIS cloud synchronization requires Ministry of Home Affairs (MHA) leased-line VPN credentials and STQC-certified fingerprint scanners. Local mode operates air-gapped.
* **APIs:**
  * `POST /api/v1/biometric/enroll`
  * `POST /api/v1/biometric/match`

---

## 10. SHO Supervisory Roll Call Briefing Generator

* **Real Police Problem:** Every morning at 08:00 hrs, SHOs conduct station roll calls. Head Constables spend 2+ hours manually preparing paper registers, risking missed court dates or expired remand deadlines.
* **Module:** `backend/app/services/reports/sho_briefing.py`
* **Test Suite:** `backend/tests/advanced/test_sho_briefing.py`
* **Outputs:**
  * Structured JSON dashboard feed.
  * High-resolution, printable ReportLab PDF clipboard dossier formatted for roll call inspection.
  * Direct sections: Custody Remand (< 24h), New FIRs (24h), Court Bail Hearings Today, Tactical Patrol Hotspots.
* **API:** `GET /api/v1/reports/sho-briefing/{station_id}?format=pdf`
