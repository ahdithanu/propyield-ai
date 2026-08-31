from fastapi import APIRouter
from app.harness.evaluation_harness import eval_harness
from app.models.listing import HarnessEvalReport
from app.pipeline.looped_runner import looped_engine

router = APIRouter()

@router.post("/evaluate", response_model=HarnessEvalReport)
async def run_evaluation_harness_suite():
    """
    Harness Engineering Endpoint: executes end-to-end evaluation suite auditing quality, density, stealth resilience, and ML drift.
    """
    iteration_summary = await looped_engine.run_pipeline_iteration()
    return eval_harness.latest_report

@router.get("/latest-report", response_model=HarnessEvalReport)
async def get_latest_harness_report():
    """
    Retrieves latest Evaluation Harness audit report.
    """
    if not eval_harness.latest_report:
        await looped_engine.run_pipeline_iteration()
    return eval_harness.latest_report
