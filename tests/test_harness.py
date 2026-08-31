from app.harness.evaluation_harness import EvaluationHarness

def test_evaluation_harness():
    harness = EvaluationHarness()
    report = harness.run_evaluation(
        raw_listings_count=100,
        cleaned_listings_count=95,
        anomalies_detected=3,
        stealth_blocked_count=2,
        ml_mae=35000.0
    )

    assert report.quality_score == 95.0
    assert report.stealth_resilience_score > 90.0
    assert report.status in ["PASSED", "DEGRADED"]
