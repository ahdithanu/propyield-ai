import pytest
from app.pipeline.data_quality import DataQualityEngine
from app.pipeline.feature_store import FeatureStore

def test_data_quality_sanitization():
    dq = DataQualityEngine()
    sample_raw = [
        {"external_id": "p1", "title": "Good Retail", "price": 1000000.0, "cap_rate": 6.5, "sqft": 5000.0, "city": "Austin", "state": "TX"},
        {"external_id": "p2", "title": "Missing Price", "price": 0.0, "cap_rate": 6.5}, # Invalid
        {"external_id": "p3", "title": "Good Industrial", "price": 5000000.0, "cap_rate": 7.5, "sqft": 25000.0, "city": "Dallas", "state": "TX"}
    ]

    cleaned, anomalies, dropped = dq.validate_and_clean(sample_raw)
    assert len(cleaned) >= 1
    assert dropped == 1

def test_feature_store_computation():
    fs = FeatureStore()
    sample = [
        {"external_id": "p1", "title": "Retail", "price": 1000000.0, "cap_rate": 6.5, "sqft": 5000.0, "state": "TX"}
    ]
    computed = fs.compute_features(sample)
    assert computed[0]["price_per_sqft"] == 200.0
    assert computed[0]["state_avg_cap_rate"] == 6.5
