import pytest
import asyncio
from app.pipeline.cron_scheduler import PipelineCronScheduler

@pytest.mark.asyncio
async def test_cron_scheduler_lifecycle():
    scheduler = PipelineCronScheduler()
    assert scheduler.get_status()["cron_enabled"] is True
    assert scheduler.get_status()["scheduler_active"] is False

    scheduler.start()
    status = scheduler.get_status()
    assert status["scheduler_active"] is True
    assert status["cron_interval_hours"] == 24.0

    # Stop scheduler
    scheduler.stop()
    assert scheduler.get_status()["scheduler_active"] is False
