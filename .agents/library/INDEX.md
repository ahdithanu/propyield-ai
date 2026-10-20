# Harness² Experience Library Index (`INDEX.md`)

## Active Workspace Harness Components
| Component Type | Path | Purpose & Trigger |
| :--- | :--- | :--- |
| **Always-On Rules** | `AGENTS.md` | Core architecture facts, production security invariants, and skill triggers. |
| **Domain Skill (`DOM`)** | `.agents/skills/cre-schema-and-underwriting-sync/SKILL.md` | 5-file Buy Box schema synchronization contract and hybrid intent routing rules. |
| **Verification Script (`INV`)** | `.agents/skills/cre-schema-and-underwriting-sync/scripts/verify_schema_parity.py` | Mechanical verification of all 25 Buy Box & Big 3 CapEx attributes across DB, Pydantic, FeatureStore, and Frontend TypeScript normalizer. |

## Experience Entries
- **`EXP-2026-10-18-01`**: Hybrid Fast-Path Intent Routing vs. TF-IDF Noun Dilution (`helped`).
- **`EXP-2026-10-18-02`**: Backend-to-Frontend Tolerant Normalizer Field Stripping (`helped`).
- **`EXP-2026-10-18-03`**: Dual-Dialect (`sqlite+aiosqlite` / `postgresql+asyncpg`) URL Normalization & Schema Inspection (`helped`).
