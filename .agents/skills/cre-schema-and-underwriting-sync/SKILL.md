---
name: cre-schema-and-underwriting-sync
description: >-
  Synchronizes Commercial Real Estate (CRE) Buy Box & Big 3 CapEx schema fields
  across SQLAlchemy models, dual-dialect migrations, feature engineering, and
  frontend TypeScript normalizers, and maintains deterministic intent routing.
---

# CRE Schema & Underwriting Synchronization Skill

Use this skill whenever adding, modifying, or auditing property listing attributes, Buy Box underwriting fields, or AI intent classification rules in `propyield-ai`.

## 1. The 5-File Schema Parity Contract (`DOM`)
In this workspace, every property attribute returned by `/api/v1/listings` or `/api/v1/ml/semantic-search` must be synchronized across **5 exact touchpoints**:
1. **SQLAlchemy ORM Model**: `ListingModel` in `app/db/models.py`.
2. **Dual-Dialect Startup Migration**: `expected_columns` list inside `init_db()` in `app/db/database.py` (handles both SQLite `PRAGMA table_info(listings)` and PostgreSQL `information_schema.columns` + `ALTER TABLE listings ADD COLUMN IF NOT EXISTS`).
3. **Pydantic API Contract & Feature Store**:
   - `ListingBase` in `app/models/listing.py`.
   - `FeatureStore._enrich_buy_box_attributes()` in `app/pipeline/feature_store.py` and `LoopedPipelineEngine._persist_to_db()` in `app/pipeline/looped_runner.py`.
4. **Frontend TypeScript Interface**: `Listing` interface and `STATES` constant in `frontend/src/lib/types.ts`.
5. **Frontend Tolerant Normalizer**: `toListing()` in `frontend/src/lib/api.ts` (if a field is omitted in `toListing()`, the React UI silently receives `undefined` even when the FastAPI backend returns populated JSON).

## 2. Hybrid Intent Routing Rule (`DOM`)
In `app/agent/intent_classifier.py` (`FastIntentClassifier`):
- Pure TF-IDF cosine similarity over `INTENT_EXEMPLARS` can misclassify imperative underwriting prompts (e.g. `"Underwrite this 7-bay strip center"`) as `PROPERTY_SEARCH` because noun phrases like `"strip center"` and `"bay"` have high TF-IDF weight in search exemplars.
- Always keep high-signal underwriting action terms (`underwrite|underwriting|strike\s+price|loi\s+offer|buy\s+box|capex|roof\s+rul`) in `self.deal_underwrite_pattern` as a deterministic Fast-Path before falling back to TF-IDF cosine similarity.

## 3. Automated Verification Procedure (`INV`)
After editing any schema, pipeline, or frontend normalizer file, run the deterministic parity checker script and the test suite:
```bash
python3 .agents/skills/cre-schema-and-underwriting-sync/scripts/verify_schema_parity.py
pytest tests/ -v
```
