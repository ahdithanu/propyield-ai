from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from app.api.deps import get_current_user
from app.db.models import UserModel
from app.pipeline.cron_scheduler import cron_scheduler

router = APIRouter()

@router.get("/status")
async def get_cron_pipeline_status(current_user: UserModel = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Get the live status of the automated daily lead ingestion cron scheduler.
    """
    return cron_scheduler.get_status()

@router.post("/trigger")
async def trigger_manual_ingestion(current_user: UserModel = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Manually trigger an immediate lead ingestion and pipeline calibration cycle.
    """
    try:
        summary = await cron_scheduler.run_now()
        return {
            "status": "SUCCESS",
            "message": f"Successfully ingested {summary.get('cleaned_ingested', 0)} leads.",
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lead ingestion failed: {str(e)}")
