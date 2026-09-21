import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from app.core.config import settings
from app.pipeline.looped_runner import looped_engine

logger = logging.getLogger("PipelineCronScheduler")

class PipelineCronScheduler:
    """
    Automated Background Cron Scheduler for continuous deal sourcing & lead ingestion.
    Executes daily pipeline iterations in the background process without blocking API requests.
    Supports on-demand triggering, status inspection, and configurable cron frequencies.
    """
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._running: bool = False
        self.last_run_at: Optional[datetime] = None
        self.next_run_at: Optional[datetime] = None
        self.last_run_summary: Optional[Dict[str, Any]] = None
        self.total_runs: int = 0
        self.total_leads_ingested: int = 0

    def start(self):
        if not settings.CRON_ENABLED:
            logger.info("Pipeline Cron Scheduler disabled via CRON_ENABLED=false configuration.")
            return

        if self._running and self._task and not self._task.done():
            logger.info("Pipeline Cron Scheduler is already running.")
            return

        self._running = True
        self._task = asyncio.create_task(self._cron_loop(), name="cre_lead_ingestion_cron")
        logger.info(f"Pipeline Cron Scheduler started with interval: {settings.CRON_INTERVAL_HOURS} hours.")

    def stop(self):
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            logger.info("Pipeline Cron Scheduler canceled.")

    async def run_now(self) -> Dict[str, Any]:
        """
        Manually trigger an immediate lead ingestion cron run.
        """
        logger.info("Manual lead ingestion cron run triggered.")
        summary = await looped_engine.run_pipeline_iteration()
        self.last_run_at = datetime.utcnow()
        self.last_run_summary = summary
        self.total_runs += 1
        self.total_leads_ingested += summary.get("cleaned_ingested", 0)
        return summary

    async def _cron_loop(self):
        interval_seconds = max(60, int(settings.CRON_INTERVAL_HOURS * 3600))
        logger.info(f"Pipeline cron loop active. Cycle interval: {interval_seconds}s ({settings.CRON_INTERVAL_HOURS}h).")

        while self._running:
            try:
                self.next_run_at = datetime.fromtimestamp(datetime.utcnow().timestamp() + interval_seconds)
                # Wait for interval duration
                await asyncio.sleep(interval_seconds)

                if not self._running:
                    break

                logger.info("Executing scheduled daily lead ingestion cycle...")
                summary = await looped_engine.run_pipeline_iteration()
                self.last_run_at = datetime.utcnow()
                self.last_run_summary = summary
                self.total_runs += 1
                self.total_leads_ingested += summary.get("cleaned_ingested", 0)
                logger.info(f"Scheduled lead ingestion completed: {summary.get('cleaned_ingested', 0)} leads processed.")
            except asyncio.CancelledError:
                logger.info("Pipeline cron loop cancelled.")
                break
            except Exception as exc:
                logger.error(f"Error during scheduled lead ingestion cycle: {exc}", exc_info=True)
                # Brief sleep before retry to prevent spin on fatal errors
                await asyncio.sleep(60)

    def get_status(self) -> Dict[str, Any]:
        return {
            "cron_enabled": settings.CRON_ENABLED,
            "cron_interval_hours": settings.CRON_INTERVAL_HOURS,
            "scheduler_active": bool(self._running and self._task and not self._task.done()),
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "next_run_at": self.next_run_at.isoformat() if self.next_run_at else None,
            "total_runs": self.total_runs,
            "total_leads_ingested": self.total_leads_ingested,
            "last_run_summary": self.last_run_summary
        }

# Global Singleton Instance
cron_scheduler = PipelineCronScheduler()
