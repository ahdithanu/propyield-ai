# Commercial Real Estate Automated Data Pipeline, Graph Engine & Deep ML Search API

> **An enterprise-grade, fully-automated data extraction pipeline, Property Graph topology engine, Isolation Forest anomaly detector, Deep ML valuation model, and high-performance FastAPI search API designed for the Commercial Real Estate (CRE) market.**

---

## 🏛️ Executive Summary & Architecture

Most real estate data systems suffer from stale listings, rate-limit blocks, corrupted pricing data, and shallow search filters. This project solves these challenges by combining:

1. **Playwright + Stealth Anti-Bot Evasion:** Stealth browser context management with proxy rotation hooks to bypass modern bot protection (Crexi.com / LoopNet / BizBuySell compatible).
2. **Data Quality & Isolation Forest Anomaly Engine:** Machine learning anomaly detection to sanitize price, sqft, and cap rate outliers prior to ingestion.
3. **Graph Engineering Engine:** NetworkX Property Graph mapping properties, locations, property types, and similarity relationships. Computes PageRank centrality to identify market hubs.
4. **Deep ML Valuation & Vector Search Engine:** Scikit-learn Random Forest regression model to compute predicted market valuation and **Undervaluation Deal Scores** (flagging high-yield deals), combined with TF-IDF vector embeddings for natural language semantic property search.
5. **Harness Engineering & Looped Pipeline:** Execution harness that audits quality score, graph density, stealth resilience, and ML drift, automatically calibrating stealth delay parameters in a closed feedback loop.
6. **FastAPI REST API:** Sub-500ms multi-attribute filtering (city, state, cap rate range, price range, sqft) with OpenAPI/Swagger documentation.

---

## 🔄 Closed-Loop Pipeline Architecture

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       LOOPED PIPELINE ENGINE                           │
   │               (Continuous Iterative Feedback Loop)                     │
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
 ┌──────────────────────┐                             ┌──────────────────────┐
 │ 1. Ingestion Engine  │                             │ 6. Adaptive Feedback │
 │ (Playwright Stealth  │                             │ (Self-calibrate      │
 │  Scraper & Proxies)  │                             │  delays & ML drift)  │
 └──────────┬───────────┘                             └──────────▲───────────┘
            │ Raw Data                                           │ Metrics
            ▼                                                    │ & Diagnostics
 ┌──────────────────────┐                             ┌──────────┴───────────┐
 │ 2. Quality & Anomaly │                             │ 5. Harness Engine    │
 │ (Isolation Forest &  │                             │ (Evaluation Suite &  │
 │  Schema Audit)       │                             │  Benchmark Metrics)  │
 └──────────┬───────────┘                             └──────────▲───────────┘
            │ Verified Data                                      │ Predictions
            ▼                                                    │ & Topology
 ┌──────────────────────┐                             ┌──────────┴───────────┐
 │ 3. Graph Engineering │                             │ 4. Deep ML Inference │
 │ (Property Graph,     ├────────────────────────────►│ (Valuation, Deal     │
 │  Locations & Edges)  │                             │  Score & Embeddings) │
 └──────────────────────┘                             └──────────────────────┘
```

---

## 🛠️ Tech Stack & Key Technologies

* **API & Web Framework:** FastAPI, Uvicorn, Pydantic v2, AsyncIO
* **Scraping & Stealth:** Playwright Async, `playwright-stealth`
* **Data Quality & ML:** Scikit-Learn (Isolation Forest, RandomForestRegressor, TF-IDF Vectorizer), Pandas, NumPy
* **Graph Engineering:** NetworkX (Property Graphs, Multi-hop Traversals, PageRank Centrality)
* **Storage & ORM:** SQLAlchemy 2.0 (Async), SQLite / PostgreSQL (Supabase compatibility)
* **DevOps & Testing:** Docker, Docker Compose, GitHub Actions, Pytest

---

## 🚀 Quickstart Guide

### Option 1: Local Virtual Environment

```bash
# 1. Clone repository and navigate to directory
cd crexi-realestate-scraper-api

# 2. Initialize virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies and Playwright browser
pip install -r requirements.txt
playwright install chromium

# 4. Run standalone Looped Pipeline iteration (CLI mode)
python -m app.main --run-pipeline

# 5. Launch FastAPI server
python -m app.main
```

The API will be live at `http://localhost:8000`. Access Swagger UI docs at `http://localhost:8000/docs`.

### Option 2: Docker Compose

```bash
# Build and spin up containers
docker-compose up --build
```

---

## 📡 REST API Endpoints Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/listings` | `GET` | Filter CRE listings by `city`, `state`, `min_price`, `max_price`, `min_cap_rate`, `max_cap_rate`, `property_type` with pagination |
| `/api/v1/listings/{id}` | `GET` | Retrieve single property listing detail by ID |
| `/api/v1/listings/trigger-scrape` | `POST` | Trigger an on-demand closed-loop pipeline iteration |
| `/api/v1/graph/neighbors/{id}` | `GET` | Multi-hop property graph neighborhood traversal |
| `/api/v1/graph/market-hubs` | `GET` | PageRank centrality top commercial real estate market hubs |
| `/api/v1/harness/evaluate` | `POST` | Execute Evaluation Harness suite (quality, density, stealth resilience, ML drift) |
| `/api/v1/harness/latest-report` | `GET` | Retrieve latest Evaluation Harness audit report |
| `/api/v1/ml/predict-price` | `POST` | ML valuation model predicting fair market price, price/sqft, and undervaluation deal score |
| `/api/v1/ml/semantic-search` | `POST` | Natural language vector search over listing embeddings |
| `/api/v1/ml/deals` | `GET` | Retrieve top high-yield investment opportunities ranked by Undervaluation Score |
| `/api/v1/analytics/market-summary` | `GET` | Aggregated market statistics (avg cap rate, total inventory, market yield) |

---

## 🧪 Running the Test Suite

```bash
# Run pytest test suite
.venv/bin/pytest tests/ -v
```

---

## 📄 License
Apache 2.0 - Open Source FDE Portfolio Project
