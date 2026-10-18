import hashlib
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.db.models import UserModel
from app.pipeline.cron_scheduler import cron_scheduler

router = APIRouter()

class PipelineTriggerRequest(BaseModel):
    region: Optional[str] = None  # e.g. "ALL", "SOUTHEAST", "MIDWEST", "WEST_COAST", "SOUTH_CENTRAL", "SOUTHWEST_MOUNTAIN", "NORTHEAST"
    per_market: int = 2

class UnderwriteActionRequest(BaseModel):
    address: str = Field(..., example="5910 Karl Rd, Columbus, OH")
    asking_price: float = Field(..., gt=0, example=2350000.0)
    sqft: float = Field(..., gt=0, example=14800.0)
    bays_count: int = Field(..., ge=0, example=7)
    roof_age_years: Optional[int] = Field(default=6, ge=0, example=6)
    hvac_over_12yr_count: Optional[int] = Field(default=0, ge=0, example=1)
    parking_reseal_est: Optional[float] = Field(default=0.0, ge=0.0, example=12500.0)
    occupancy_pct: Optional[float] = Field(default=88.0, ge=0.0, le=100.0)

class UnderwriteActionResponse(BaseModel):
    buy_box_verdict: str
    loi_strike_price: float
    total_capex_deductions: float
    cadastral_apn: str
    breakdown: Dict[str, Any]

def execute_deterministic_underwriting(req: UnderwriteActionRequest) -> UnderwriteActionResponse:
    """
    Deterministic Python execution for Buy Box evaluation, Big 3 CapEx RUL audit,
    and LOI Strike Price calculation (zero LLM arithmetic hallucination).
    """
    roof_age = req.roof_age_years if req.roof_age_years is not None else 6
    roof_rul = max(0, 20 - roof_age)
    # If roof RUL <= 5 years, reserve $8.50/sqft for TPO replacement
    roof_deduction = round(req.sqft * 8.50, 2) if roof_rul <= 5 else 0.0

    # Each RTU unit over 12 years old requires a $9,500 replacement reserve
    hvac_old_units = req.hvac_over_12yr_count or 0
    hvac_deduction = round(hvac_old_units * 9500.0, 2)

    parking_deduction = round(req.parking_reseal_est or 0.0, 2)
    total_capex = round(roof_deduction + hvac_deduction + parking_deduction, 2)
    loi_strike_price = round(max(0.0, req.asking_price - total_capex), 2)
    price_per_sqft = round(req.asking_price / max(1.0, req.sqft), 2)

    reasons: List[str] = []
    caution_flags = 0
    fail_flags = 0

    # Buy Box Criteria Check (5-10 bays ideal for multi-tenant strip, or price/sqft and CapEx thresholds)
    if 5 <= req.bays_count <= 10:
        reasons.append(f"Bays count ({req.bays_count}) matches core 5-10 bay multi-tenant strip Buy Box.")
    elif req.bays_count > 0:
        caution_flags += 1
        reasons.append(f"Bays count ({req.bays_count}) is outside target 5-10 bay sweet spot.")
    else:
        fail_flags += 1
        reasons.append("Invalid bays count (0 bays).")

    if total_capex / req.asking_price > 0.15:
        fail_flags += 1
        reasons.append(f"Big 3 CapEx reserve (${total_capex:,.0f}) exceeds 15% of asking price.")
    elif total_capex > 0:
        caution_flags += 1
        reasons.append(f"Big 3 CapEx deduction of ${total_capex:,.0f} applied to LOI strike price.")
    else:
        reasons.append("Zero immediate Big 3 CapEx deductions required.")

    if fail_flags > 0:
        verdict = "FAIL"
    elif caution_flags > 0:
        verdict = "CAUTION"
    else:
        verdict = "PASS"

    # Deterministic cadastral APN hash from normalized address
    addr_hash = hashlib.sha256(req.address.strip().upper().encode("utf-8")).hexdigest()
    apn = f"{int(addr_hash[:3], 16) % 900 + 100}-{int(addr_hash[3:6], 16) % 900 + 100}-{int(addr_hash[6:10], 16) % 9000 + 1000}"

    return UnderwriteActionResponse(
        buy_box_verdict=verdict,
        loi_strike_price=loi_strike_price,
        total_capex_deductions=total_capex,
        cadastral_apn=apn,
        breakdown={
            "asking_price": req.asking_price,
            "price_per_sqft": price_per_sqft,
            "roof_rul_years": roof_rul,
            "roof_deduction": roof_deduction,
            "hvac_deduction": hvac_deduction,
            "parking_deduction": parking_deduction,
            "reasons": reasons
        }
    )

@router.get("/status")
async def get_cron_pipeline_status(current_user: UserModel = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get the live status of the automated daily lead ingestion cron scheduler.
    """
    return cron_scheduler.get_status()

@router.post("/trigger")
async def trigger_manual_ingestion(
    req: Optional[PipelineTriggerRequest] = None,
    current_user: UserModel = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Manually trigger an immediate nationwide lead ingestion and pipeline calibration cycle.
    Supports filtering to specific economic regions or full nationwide coverage.
    """
    try:
        region_filter = req.region if req and req.region and req.region.upper() != "ALL" else None
        per_mkt = req.per_market if req and req.per_market > 0 else 2
        summary = await cron_scheduler.run_now(region_filter=region_filter, per_market=per_mkt)
        return {
            "status": "SUCCESS",
            "region": req.region.upper() if req and req.region else "NATIONWIDE",
            "message": f"Successfully ingested {summary.get('cleaned_ingested', 0)} live properties nationwide.",
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Nationwide lead ingestion failed: {str(e)}")

@router.post("/underwrite-action", response_model=UnderwriteActionResponse, operation_id="UnderwriteCommercialDeal")
async def underwrite_commercial_deal(
    req: UnderwriteActionRequest,
    current_user: UserModel = Depends(get_current_user)
) -> UnderwriteActionResponse:
    """
    Salesforce Agentforce Invocable Action (`UnderwriteCommercialDeal`):
    Evaluates a commercial property against the buyer's Buy Box, checks Big 3 CapEx RUL,
    and computes the deterministic LOI strike price.
    """
    return execute_deterministic_underwriting(req)

@router.get("/agentforce-schema")
async def get_agentforce_openapi_schema() -> Dict[str, Any]:
    """
    Returns the OpenAPI 3.0 specification for Salesforce Agentforce Atlas Reasoning Engine integration.
    """
    schema_path = Path(__file__).resolve().parents[3] / "integrations" / "salesforce" / "agentforce_schema.json"
    if schema_path.exists():
        return json.loads(schema_path.read_text(encoding="utf-8"))
    raise HTTPException(status_code=404, detail="Agentforce schema file not found")
