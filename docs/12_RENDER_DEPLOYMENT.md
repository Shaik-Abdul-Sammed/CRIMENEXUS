# CRIMENEXUS — Live Public Cloud Deployment Guide (Render & Neo4j AuraDB)

This guide provides instructions to deploy CRIMENEXUS to a live, publicly accessible URL for demonstrations to Director Generals of Police (DGP), State Home Departments, and Cyber Crime Cells without requiring local Docker installation.

---

## Architecture Overview

```
                                      +-------------------------------+
                                      |   Web Browser / Field IO      |
                                      +---------------+---------------+
                                                      |
                                                      v
                                      +-------------------------------+
                                      |   CRIMENEXUS React Frontend   |
                                      |   (Render Static Site)        |
                                      |   https://crimenexus.onrender |
                                      +---------------+---------------+
                                                      |
                                                      v
                                      +-------------------------------+
                                      |   FastAPI Intelligence Engine |
                                      |   (Render Docker Web Service) |
                                      |   https://*-backend.onrender  |
                                      +-------+---------------+-------+
                                              |               |
                         +--------------------+               +--------------------+
                         v                                                         v
         +-------------------------------+                         +-------------------------------+
         |   Managed PostgreSQL DB       |                         |   Managed Neo4j Graph DB      |
         |   (Render Managed Postgres)   |                         |   (Neo4j AuraDB Free Tier)    |
         +-------------------------------+                         +-------------------------------+
```

---

## Prerequisites (100% Free Tier)

1. **GitHub Account**: Access to the CRIMENEXUS repository: `https://github.com/Shaik-Abdul-Sammed/CRIMENEXUS`
2. **Render Account**: Free tier at [https://render.com](https://render.com)
3. **Neo4j AuraDB Account**: Free tier graph database instance at [https://neo4j.com/cloud/platform/aura-graph-database/](https://neo4j.com/cloud/platform/aura-graph-database/)

---

## Step 1: Provision Free Cloud Graph Database (Neo4j AuraDB)

1. Go to [https://console.neo4j.io/](https://console.neo4j.io/) and sign in.
2. Click **Create Instance** and select **AuraDB Free**.
3. Choose instance name: `crimenexus-graph`.
4. **Save the generated credentials**:
   - Connection URI: `neo4j+s://<unique-id>.databases.neo4j.io`
   - Username: `neo4j`
   - Password: `<your-generated-password>`
5. Download the `.txt` credentials file to keep it secure.

---

## Step 2: Connect GitHub Repository to Render Blueprint

1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation bar and select **Blueprint**.
3. Connect your GitHub account and select repository: `Shaik-Abdul-Sammed/CRIMENEXUS`.
4. Render will automatically detect and parse [`render.yaml`](../render.yaml) at the repository root.
5. Render displays the Blueprint Service Manifest:
   - `crimenexus-backend` (Docker Web Service)
   - `crimenexus-frontend` (Static Site with SPA rewrite rule `/* -> /index.html`)
   - `crimenexus-postgres` (Managed PostgreSQL 15)
   - `crimenexus-redis` (Redis Stream Broker)

---

## Step 3: Configure Environment Secrets

In the Render Blueprint configuration screen, supply the required environment variables:

| Key | Value / Source | Description |
| :--- | :--- | :--- |
| `NEO4J_URI` | `neo4j+s://<unique-id>.databases.neo4j.io` | Connection string from Neo4j AuraDB |
| `NEO4J_USER` | `neo4j` | Default AuraDB username |
| `NEO4J_PASSWORD` | `<your-auradb-password>` | Secret password from Step 1 |
| `ENVIRONMENT` | `production` | Enables production security & TLS checks |
| `VITE_API_BASE_URL`| `https://crimenexus-backend.onrender.com/api/v1` | Automatically wired to your backend |

> **Note**: `DATABASE_URL` and `REDIS_URL` are automatically injected by Render from the managed database services declared in `render.yaml`.

---

## Step 4: Click Deploy & Verify Live Status

1. Click **Apply** or **Deploy**.
2. Render provisions:
   - PostgreSQL database instance (~90 seconds)
   - Docker container build for FastAPI backend (~2 minutes)
   - Vite production bundle for frontend (~45 seconds)
3. Once all services show **Live (Green Checkmark)**:
   - **Frontend URL**: `https://crimenexus-frontend.onrender.com`
   - **Backend Swagger Docs**: `https://crimenexus-backend.onrender.com/docs`
   - **Health Endpoint**: `https://crimenexus-backend.onrender.com/api/v1/ml/status`

---

## Step 5: Seeding Sample Police Intelligence (First Run)

To populate the cloud Neo4j and Postgres instances with the seeded Rajan Hawala syndicate:

1. Open your Render Dashboard -> `crimenexus-backend` -> **Shell**.
2. Run the database migration and seeder:
   ```bash
   alembic upgrade head
   PYTHONPATH=. python -m app.database.seed
   ```
3. Open `https://crimenexus-frontend.onrender.com` in your browser.
4. Log in as **Field Investigator** and explore the live Cytoscape graph and smurfing analytics!
