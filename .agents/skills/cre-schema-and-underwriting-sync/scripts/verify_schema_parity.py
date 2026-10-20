#!/usr/bin/env python3
"""
Deterministic schema parity verifier for PropYield AI.
Checks that all 25 Buy Box, Big 3 CapEx, and core underwriting columns exist across:
  1. app/db/models.py (ListingModel)
  2. app/db/database.py (init_db expected_columns migration list)
  3. app/models/listing.py (ListingBase)
  4. app/pipeline/feature_store.py (_enrich_buy_box_attributes)
  5. frontend/src/lib/api.ts (toListing normalizer)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]

REQUIRED_BUY_BOX_FIELDS = [
    "bays_count",
    "anchor_type",
    "shadow_anchor_name",
    "occupancy_pct",
    "max_tenant_pct",
    "restaurant_pct",
    "service_tenant_pct",
    "roof_type",
    "roof_age_years",
    "roof_rul_years",
    "roof_replacement_est",
    "hvac_units_count",
    "hvac_avg_age_years",
    "hvac_over_12yr_count",
    "hvac_replacement_est",
    "parking_stalls",
    "parking_ratio",
    "parking_condition",
    "parking_reseal_est",
    "traffic_vpd",
    "intersection_type",
    "lease_structure",
    "walt_years",
    "unit_count",
    "price_per_unit",
]

TARGETS = {
    "app/db/models.py": ROOT / "app" / "db" / "models.py",
    "app/db/database.py": ROOT / "app" / "db" / "database.py",
    "app/models/listing.py": ROOT / "app" / "models" / "listing.py",
    "app/pipeline/feature_store.py": ROOT / "app" / "pipeline" / "feature_store.py",
    "frontend/src/lib/types.ts": ROOT / "frontend" / "src" / "lib" / "types.ts",
    "frontend/src/lib/api.ts": ROOT / "frontend" / "src" / "lib" / "api.ts",
}


def main() -> int:
    missing_report = []
    for label, path in TARGETS.items():
        if not path.exists():
            missing_report.append(f"[MISSING FILE] {label} ({path})")
            continue
        content = path.read_text(encoding="utf-8")
        for field in REQUIRED_BUY_BOX_FIELDS:
            if not re.search(rf"\b{re.escape(field)}\b", content):
                missing_report.append(f"[MISSING FIELD] '{field}' not found in {label}")

    if missing_report:
        print("FAIL: Schema parity check detected drift:")
        for line in missing_report:
            print(f"  - {line}")
        return 1

    print(
        f"PASS: All {len(REQUIRED_BUY_BOX_FIELDS)} Buy Box & Big 3 CapEx fields verified across all {len(TARGETS)} backend/frontend layers."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
