# CRIMENEXUS Production Deployment Blueprint: Cloud Architecture & PaaS Evaluation

**Document ID:** CN-DOC-06-DEPLOY  
**Author:** Principal DevOps Engineer & Data Platform Architect  
**Classification:** RESTRICTED // LAW ENFORCEMENT IT INFRASTRUCTURE  
**Target Environment:** Cloud PaaS (Render + Neo4j AuraDB) vs. On-Premises Air-Gapped Police Grid  

---

## 1. Executive Summary & PaaS Platform Selection

CRIMENEXUS is an enterprise multi-modal crime analytics and intelligence platform combining:
- **FastAPI Backend:** Python 3.10 with high-throughput asynchronous endpoints.
- **Deep ML / AI Engine:** Scikit-Learn (Isolation Forest, BallTree, TF-IDF), Sentence-Transformers, ONNX Runtime, and OpenCV RTSP demuxing.
- **Polyglot Persistence Layer:** Dual-write PostgreSQL (relational & PostGIS spatial) + Neo4j (graph topology) + Redis (event stream broker & hot caching).
- **Background Daemons:** 15-minute CCTNS/ICJS polling loop, RTSP ANPR camera stream listener, and Redis Stream consumers.
- **React Frontend:** Modern Single Page Application (React 19, TypeScript, Tailwind CSS, Cytoscape.js).

To provide an accessible cloud demonstration environment with Infrastructure-as-Code (IaC), **Render** paired with **Neo4j AuraDB Free** has been selected as the premier cloud deployment target.

---

## 2. Platform Comparison & Disqualification Matrix

| Deployment Platform | Compatibility | Verdict | Technical Reason for Disqualification / Selection |
| :--- | :--- | :--- | :--- |
| **GitHub Pages** | ❌ **0%** | **DISQUALIFIED** | GitHub Pages is an HTTP static file web server only. It cannot execute Python, manage Docker containers, host PostgreSQL/Redis databases, or run background daemons. |
| **Vercel** | ❌ **15%** | **DISQUALIFIED** | Vercel relies on ephemeral serverless Lambda functions. CRIMENEXUS requires **>1.5 GB memory** for ML dependencies (`torch`, `opencv`, `sentence-transformers`), which exceeds Vercel's 250 MB serverless artifact limit. Furthermore, serverless functions terminate after 15 seconds, making continuous RTSP video processing and CCTNS background polling impossible. |
| **Render (Selected)** | ✅ **95%** | **APPROVED** | Supports containerized Docker runtime, managed PostgreSQL, managed Redis, persistent web processes, environment variable orchestration, and Git-driven continuous deployment via `render.yaml`. |
| **AWS GovCloud / NIC MeghRaj** | ✅ **100%** | **RECOMMENDED FOR PROD** | Statutory requirement for sovereign Indian police deployment. Air-gapped VPC, MEITY-empaneled data centers, dedicated GPU nodes for Ollama/Mistral, and direct CCTNS leased-line connectivity. |

---

## 3. Infrastructure-as-Code: `render.yaml` Blueprint

The root [`render.yaml`](../render.yaml) file defines the complete infrastructure topology for Render:

```yaml
services:
  # 1. CRIMENEXUS Backend (Dockerized FastAPI + ML + NetworkX)
  - type: web
    name: crimenexus-backend
    runtime: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    plan: free
    region: singapore
    healthCheckPath: /api/v1/ml/status
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: crimenexus-postgres
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: crimenexus-redis
          property: connectionString
      - key: NEO4J_URI
        sync: false
      - key: NEO4J_USER
        value: neo4j
      - key: NEO4J_PASSWORD
        sync: false
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: CCTNS_API_KEY
        sync: false
      - key: ENVIRONMENT
        value: production

  # 2. CRIMENEXUS Frontend (React 19 + TypeScript + Vite)
  - type: web
    name: crimenexus-frontend
    runtime: static
    plan: free
    region: singapore
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_BASE_URL
        value: https://crimenexus-backend.onrender.com

  # 3. Redis Stream Broker
  - type: redis
    name: crimenexus-redis
    plan: free
    region: singapore
    ipAllowList: []

databases:
  # Managed PostgreSQL
  - name: crimenexus-postgres
    plan: free
    region: singapore
    databaseName: crimenexus
    user: crimenexus_admin
```

---

## 4. Step-by-Step Deployment Guide (Render + Neo4j AuraDB)

### Step 4.1: Provision Cloud Graph Database (Neo4j AuraDB Free)
1. Navigate to [Neo4j Aura Console](https://console.neo4j.io/).
2. Sign in and select **Create Instance** -> **AuraDB Free**.
3. Choose instance region closest to Render (e.g. `ap-southeast-1` Singapore or `eu-central-1`).
4. Save the generated credentials:
   - **Connection URI:** `neo4j+s://<instance-id>.databases.neo4j.io`
   - **Username:** `neo4j`
   - **Password:** `<generated-secret-password>`
5. Download the `.txt` credentials file to a secure credential vault.

### Step 4.2: Deploy Blueprint on Render
1. Sign in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository (`CRIMENEXUS`).
4. Render will parse [`render.yaml`](../render.yaml) and display the execution plan:
   - 1 Managed PostgreSQL Database (`crimenexus-postgres`)
   - 1 Managed Redis Instance (`crimenexus-redis`)
   - 1 Docker Web Service (`crimenexus-backend`)
   - 1 Static Site (`crimenexus-frontend`)
5. When prompted for environment variables, enter:
   - `NEO4J_URI`: `neo4j+s://<instance-id>.databases.neo4j.io`
   - `NEO4J_PASSWORD`: `<your-auradb-password>`
   - `CCTNS_API_KEY`: `CCTNS-SECURE-KEY-STATE-POLICE-2026`
   - `OLLAMA_BASE_URL`: (Optional; leave unset for safe automated template fallback or supply a remote Ollama server)
6. Click **Apply**. Render will automatically build the container image, run migrations, compile the frontend Vite assets, and wire network bindings.

### Step 4.3: Post-Deployment Verification
Verify system health by calling the backend health checks:
```bash
# 1. Verify ML service status and model availability
curl -s https://crimenexus-backend.onrender.com/api/v1/ml/status | jq .

# 2. Verify external CCTNS adapter readiness
curl -s https://crimenexus-backend.onrender.com/api/v1/external/cctns/sync/FIR-2026-DEL-8902 | jq .

# 3. Access the interactive web portal
open https://crimenexus-frontend.onrender.com
```

---

## 5. Free-Tier Operational Limitations & SLA Analysis

While the Render + AuraDB stack enables zero-cost demonstration and evaluation, police administrators must understand the operational constraints of free cloud tiers:

| Infrastructure Component | Free-Tier Specification | Real-World Operational Constraint | Police Production Impact |
| :--- | :--- | :--- | :--- |
| **Render Web Service (Backend)** | 512 MB RAM, 0.1 CPU core | Container spins down after 15 minutes of HTTP inactivity. | **Cold Start Delay:** Initial API request takes 30–50 seconds to wake up container. |
| **Render Web Service (Memory)** | 512 MB RAM limit | Heavy PyTorch models or full spaCy transformer pipelines will encounter Out-Of-Memory (OOM) kills. | System uses optimized regex, Scikit-Learn BallTree, and lightweight embeddings to stay under 420 MB. |
| **Render PostgreSQL** | 1 GB SSD storage, 97 connections | Free database expires after 90 days if not renewed. | Unsuitable for storing multi-year statewide FIR archives without automated external backups. |
| **Render Redis** | 25 MB memory, no persistent disk | In-memory only; LRU eviction when limit reached. | High-frequency ANPR video streams will drop historical cache entries if unconsumed. |
| **Neo4j AuraDB Free** | 1 instance, 200,000 nodes, 400,000 edges | Pauses automatically after 3 days of database inactivity. | Requires manual resume in console if left unattended over weekends. |

---

## 6. Sovereign Government Production Architecture (NIC / MeghRaj / State Data Centre)

For formal deployment in State Police Headquarters or National Cyber Crime Command, CRIMENEXUS transitions to the following dedicated architecture:

```
                          ┌──────────────────────────────────────────────┐
                          │     National Police Grid / CCTNS Leased Line │
                          └──────────────────────┬───────────────────────┘
                                                 │
                                                 ▼
┌──────────────────────┐         ┌──────────────────────────────────────────────┐
│  State Police WAN /  │         │       CRIMENEXUS API Gateway & Reverse Proxy │
│  District HQ Intranet├────────►│  (NGINX / HAProxy + SSL + Mutual TLS MHA)    │
└──────────────────────┘         └──────────────────────┬───────────────────────┘
                                                        │
                      ┌─────────────────────────────────┴─────────────────────────────────┐
                      ▼                                                                   ▼
       ┌──────────────────────────────┐                                    ┌──────────────────────────────┐
       │   Dockerized FastAPI Nodes   │                                    │  Live Stream Demuxer Engine  │
       │   (4x Worker Pods, 16GB RAM) │                                    │  (OpenCV RTSP Highway ANPR)  │
       └──────────────┬───────────────┘                                    └──────────────┬───────────────┘
                      │                                                                   │
       ┌──────────────┼──────────────────────────────┬────────────────────────────────────┘
       ▼              ▼                              ▼
┌──────────────┐┌──────────────┐      ┌──────────────────────────────┐     ┌──────────────────────────────┐
│ PostgreSQL   ││ Neo4j EE     │      │ Redis Cluster                │     │ Self-Hosted Ollama / Mistral │
│ (PostGIS,    ││ (Enterprise  │      │ (Persistence AOF + RDB,      │     │ (Local NVIDIA L40S GPU Node, │
│ 2TB NVMe)    ││ 10M+ Nodes)  │      │ High-Speed Telemetry Streams)│     │ Zero Cloud API Leakage)      │
└──────────────┘└──────────────┘      └──────────────────────────────┘     └──────────────────────────────┘
```

This ensures complete digital sovereignty, zero data leakage outside Indian borders, sub-second query latency, and continuous 24/7/365 uptime compliant with MHA and CERT-In standards.
