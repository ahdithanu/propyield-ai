# Harness² Experience Reflection Log (`EXPERIENCE.md`)

## Trajectory Reflection — Enterprise AI Audit & P0–P3 Implementation (2026-10-18)

### 1. Component Attribution & Behavioral Contrast

| Component / Edit | Dimension | Verdict | Behavioral Contrast Observed |
| :--- | :--- | :--- | :--- |
| `FastIntentClassifier.deal_underwrite_pattern` (`app/agent/intent_classifier.py`) | `DOM` | `helped` | Initial probe of `POST /api/v1/agent/chat` with `"Underwrite this 7-bay strip center for SSN 123-45-6789"` failed (`AssertionError: assert 'PROPERTY_SEARCH' == 'DEAL_UNDERWRITE'`) because `"strip center"` and `"bay"` carried higher TF-IDF weight in `PROPERTY_SEARCH` exemplars. Adding a deterministic regex fast-path for underwriting keywords resolved the misclassification in `<1ms` and brought the 28-test suite to 100% pass. |
| `FeatureStore._enrich_buy_box_attributes` + `toListing()` parity (`verify_schema_parity.py`) | `INV` + `DOM` | `helped` | Backend live extraction populated all 25 Buy Box & Big 3 CapEx fields in `ListingModel`, but inspecting `frontend/src/lib/api.ts` revealed `toListing()` dropped 22 of those fields during client normalization. Encoding the 5-file check into `verify_schema_parity.py` prevents silent frontend field loss. |
| `_normalize_database_url` + dialect-aware `init_db` (`app/db/database.py`) | `DOM` | `helped` | Render's `fromDatabase.connectionString` provides `postgres://` or `postgresql://`, whereas SQLAlchemy's async engine requires `postgresql+asyncpg://`, and `PRAGMA table_info` only works on SQLite. Dialect-aware branching enabled zero-downtime startup across both local SQLite tests and Render PostgreSQL. |

---

### 2. Extracted Transferable Lessons

#### `EXP-2026-10-18-01`: Imperative Verb Dilution in TF-IDF Intent Routers
- **`cue`**: When building or tuning a lightweight TF-IDF / cosine-similarity intent router where action intents (e.g., `DEAL_UNDERWRITE`) share domain nouns (e.g., `"strip center"`, `"retail"`, `"bays"`, `"cap rate"`) with search intents (`PROPERTY_SEARCH`).
- **`lesson`**: Precede TF-IDF cosine-similarity scoring in `app/agent/intent_classifier.py` (`FastIntentClassifier.classify`) with a deterministic regex fast-path matching explicit domain action verbs (`underwrite|strike\s+price|loi\s+offer|buy\s+box|capex`).
- **`evidence`**: In `tests/test_enterprise_security.py::test_agentforce_underwrite_action_and_unified_agent_router`, `"Underwrite this 7-bay strip center..."` scored higher against `PROPERTY_SEARCH` under pure TF-IDF (`1 failed, 27 passed`), and immediately passed (`28 passed in 5.48s`) once `self.deal_underwrite_pattern` was added.

#### `EXP-2026-10-18-02`: Tolerant Frontend Normalizer Silent Field Dropping
- **`cue`**: When adding or enriching backend ORM/Pydantic fields in a full-stack repo where the frontend uses an explicit field-mapping normalizer (`toListing(raw)` in `frontend/src/lib/api.ts`) rather than passing `raw` through directly.
- **`lesson`**: Run `.agents/skills/cre-schema-and-underwriting-sync/scripts/verify_schema_parity.py` (loaded via the `cre-schema-and-underwriting-sync` skill) to verify that every field added to `app/db/models.py` and `app/pipeline/feature_store.py` is explicitly mapped in `frontend/src/lib/types.ts` and `frontend/src/lib/api.ts`.
- **`evidence`**: Live production query `GET https://propyield-backend.onrender.com/api/v1/listings?limit=2` returned populated `bays_count`, `roof_rul_years`, and `traffic_vpd`, which were previously discarded by `toListing()` in `frontend/src/lib/api.ts#L76-L121`.
