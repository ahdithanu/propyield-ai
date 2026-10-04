from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.db.models import UserModel
from app.pipeline.cron_scheduler import cron_scheduler

router = APIRouter()

class PipelineTriggerRequest(BaseModel):
    region: Optional[str] = None  # e.g. "ALL", "SOUTHEAST", "MIDWEST", "WEST_COAST", "SOUTH_CENTRAL", "SOUTHWEST_MOUNTAIN", "NORTHEAST"
    per_market: int = 2

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
