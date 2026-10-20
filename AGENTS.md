# PropYield AI — Workspace Agent Rules (`AGENTS.md`)

## Verified Workspace Architecture & Facts
- **Backend Stack**: FastAPI (`app/main.py`) + SQLAlchemy 2.0 Async (`app/db/database.py`) supporting both `sqlite+aiosqlite` (local/test) and `postgresql+asyncpg` (Render production via `_normalize_database_url`).
- **Frontend Stack**: React 19 + Vite + TanStack Start/Router (`frontend/src/`). API normalization happens in `toListing()` inside `frontend/src/lib/api.ts`.
- **Unified AI Agent Pipeline**: Mounted at `/api/v1/agent` (`app/api/v1/endpoints/agent_endpoints.py`), chaining `MultiLayerGuardrailEngine` -> `FastIntentClassifier` -> `HybridRAGRetriever` + `CrossEncoderReranker` -> Deterministic Python Underwriting Math -> `AgentEvalEngine`.
- **Salesforce Agentforce Action**: `POST /api/v1/pipeline/underwrite-action` (`operationId: UnderwriteCommercialDeal` in `app/api/v1/endpoints/pipeline_endpoints.py`), matching `app/integrations/salesforce/agentforce_schema.json`.

## Standing Engineering Invariants
1. **Deterministic Financial Math**: Never delegate LOI strike price (`asking_price - total_capex_deductions`), cap rate, or Big 3 CapEx reserve arithmetic to an LLM; always execute via `execute_deterministic_underwriting` or Python tool functions.
2. **Production Auth Lockdown**: In `app/core/config.py` and `app/api/deps.py`, `DEMO_MODE_ALLOWED` must default to `False` when `ENVIRONMENT == "production"`, and `get_current_user_optional` must never fall back to `usr_analyst_1` in production mode.
3. **Bcrypt >72-Byte Safety**: Always pass passwords through `_normalize_password_bytes` (`app/core/security.py`) before calling `bcrypt.hashpw` or `bcrypt.checkpw`.

## Skill Triggers
- When adding, modifying, or debugging CRE listing fields, Buy Box underwriting telemetry, frontend/backend schema parity, or `FastIntentClassifier` routing, load the `cre-schema-and-underwriting-sync` skill.
