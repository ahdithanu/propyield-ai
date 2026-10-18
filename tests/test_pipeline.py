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
        {
            "external_id": "p1",
            "title": "6-Bay Retail Center",
            "property_type": "Retail",
            "price": 1000000.0,
            "cap_rate": 6.5,
            "sqft": 5000.0,
            "state": "TX",
            "description": "Prime 6-bay retail strip center."
        }
    ]
    computed = fs.compute_features(sample)
    row = computed[0]
    assert row["price_per_sqft"] == 200.0
    assert row["state_avg_cap_rate"] == 6.5
    # Verify Buy Box & Big 3 CapEx fields are populated (never None)
    assert row["bays_count"] == 6
    assert row["roof_type"] in ("TPO Membrane", "Standing Seam Metal")
    assert row["roof_rul_years"] >= 2
    assert row["hvac_units_count"] >= 2
    assert row["parking_stalls"] >= 12
    assert row["traffic_vpd"] >= 24500
    assert row["lease_structure"] == "Triple-Net (NNN)"

def test_semantic_search_no_fake_fallback_and_ml_persistence(tmp_path):
    from app.ml.semantic_engine import SemanticVectorSearchEngine
    from app.ml.valuation_model import PropertyValuationMLModel

    engine = SemanticVectorSearchEngine()
    docs = [
        {"external_id": "c1", "title": "Austin Retail Strip", "property_type": "Retail", "city": "Austin", "state": "TX", "description": "NNN retail strip center"},
        {"external_id": "c2", "title": "Dallas Industrial Warehouse", "property_type": "Industrial", "city": "Dallas", "state": "TX", "description": "Dock high warehouse"}
    ]
    engine.fit_documents(docs)
    assert len(engine.search("Austin retail")) >= 1
    assert engine.search("zzzz_nonexistent_quantum_submarine_zzzz") == []

    artifact_file = tmp_path / "valuation_model.joblib"
    m1 = PropertyValuationMLModel(artifact_path=artifact_file)
    training_data = [
        {"sqft": 10000.0, "cap_rate": 6.5, "property_type": "Retail", "state": "TX", "price": 2200000.0},
        {"sqft": 25000.0, "cap_rate": 7.2, "property_type": "Industrial", "state": "OH", "price": 3100000.0},
        {"sqft": 15000.0, "cap_rate": 6.8, "property_type": "Retail", "state": "FL", "price": 3400000.0},
    ]
    m1.train_model(training_data)
    assert artifact_file.exists()

    # Load into fresh instance without retraining
    m2 = PropertyValuationMLModel(artifact_path=artifact_file)
    assert m2.is_trained is True
    pred = m2.predict_valuation("Retail", 12000.0, "Austin", "TX", 6.6, 2000000.0)
    assert pred.estimated_price > 0
