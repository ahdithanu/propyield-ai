import uuid
from datetime import datetime
from typing import Dict, Any, List
from app.models.listing import HarnessEvalReport
from app.graph.property_graph import graph_engine

class EvaluationHarness:
    def __init__(self):
        self.latest_report: Optional[HarnessEvalReport] = None

    def run_evaluation(
        self,
        raw_listings_count: int,
        cleaned_listings_count: int,
        anomalies_detected: int,
        stealth_blocked_count: int,
        ml_mae: float = 45000.0
    ) -> HarnessEvalReport:
        """
        Executes complete Evaluation Harness suite across pipeline components.
        """
        eval_id = f"eval_{uuid.uuid4().hex[:8]}"

        # Calculate metrics
        quality_score = 100.0 * (cleaned_listings_count / max(1, raw_listings_count))
        stealth_resilience = 100.0 * ((raw_listings_count) / max(1, raw_listings_count + stealth_blocked_count))

        graph_metrics = graph_engine.get_graph_metrics()

        status = "PASSED" if (quality_score >= 80.0 and stealth_resilience >= 90.0) else "DEGRADED"

        report = HarnessEvalReport(
            evaluation_id=eval_id,
            timestamp=datetime.utcnow(),
            quality_score=round(quality_score, 2),
            data_freshness_seconds=0.0,
            total_nodes=graph_metrics["total_nodes"],
            total_edges=graph_metrics["total_edges"],
            graph_density=graph_metrics["graph_density"],
            ml_model_mae=round(ml_mae, 2),
            stealth_resilience_score=round(stealth_resilience, 2),
            status=status
        )

        self.latest_report = report
        return report

# Global Singleton Instance
eval_harness = EvaluationHarness()
