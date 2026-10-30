# STANDARD OPERATING PROCEDURE (SOP) 02: CYBER CRIME & FINANCIAL INTELLIGENCE ANALYSTS
**Document Reference:** CRIMENEXUS-SOP-02-CYBER  
**Target Audience:** Cyber Crime Police Station (CCPS) Analysts, Financial Intelligence Officers, State CID Cyber Command  
**Classification:** RESTRICTED - LAW ENFORCEMENT INTERNAL USE ONLY  
**Applicable Legal Framework:** Information Technology Act, 2000; Prevention of Money Laundering Act (PMLA); Bharatiya Sakshya Adhiniyam, 2023

---

## 1. TELECOMMUNICATION CALL DETAIL RECORD (CDR) FORENSICS
1. **Multi-Carrier CSV Parsing:**
   - CRIMENEXUS accepts CDR dumps directly from Airtel, Reliance Jio, Vodafone Idea (Vi), and BSNL/MTNL nodal officers.
   - Upload CDR files via API (`POST /api/v1/forensics/cdr/upload`) or Dashboard File Uploader.
2. **Automated Forensic Geolocation:**
   - Call records are matched against the National Cell Tower Azimuth & Coordinate Registry.
   - Frequent call corridors and colocation points are plotted automatically onto the Map View.
3. **IMEI & SIM-Swapping Anomaly Detection:**
   - The engine flags handset anomalies where 2 or more distinct SIM cards have operated within the same IMEI handset within 72 hours.
   - Displays caller-receiver frequency matrices and call burst timelines prior to crime events.

---

## 2. BANK STATEMENT & MONEY TRAIL INVESTIGATION
1. **Heterogeneous Bank Statement Parsing:**
   - Ingest CSV or electronic statements from public sector, private, or cooperative banks.
   - The parser decodes complex narration strings:
     - Extracts UPI VPA handles (e.g., `user@okhdfcbank`, `9876543210@paytm`).
     - Extracts UTR and IMPS reference numbers.
     - Identifies Hawala and Angadia keywords.
2. **Smurfing / Structuring Detection:**
   - Transactions structured below the mandatory reporting limit (e.g., rapid bursts between ₹45,000 and ₹49,999) trigger an automated **Structuring Alert**.
3. **Graph Dual-Write & Money Laundering Path Search:**
   - Accounts and holders are mapped into the Neo4j Graph Database.
   - The graph search automatically traverses multi-hop money trails:
     `(:Victim)-[:TRANSFERRED]->(:Mule_1)-[:TRANSFERRED]->(:Mule_2)-[:TRANSFERRED]->(:Syndicate_Chief)`

---

## 3. AI/ML NETWORK GRAPH ANALYTICS
1. **Centrality & Ringleader Identification:**
   - Computes Degree and Betweenness Centrality via NetworkX.
   - Highlights the highest-degree node as the primary syndicate coordinator or kingpin.
2. **Community Detection:**
   - Automatically segments complex networks into distinct operational cells (e.g., Cyber Call Center Cell vs Hawala Transit Cell).
3. **Predictive Analytics:**
   - Computes likelihood of hidden links between unassociated suspects and predicts next probable movement or transaction targets.
