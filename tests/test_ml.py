from app.ml.valuation_model import PropertyValuationMLModel
from app.ml.semantic_engine import SemanticVectorSearchEngine

def test_ml_valuation_model():
    model = PropertyValuationMLModel()
    train_data = [
        {"property_type": "Retail", "sqft": 5000, "cap_rate": 6.5, "state": "TX", "price": 1500000},
        {"property_type": "Retail", "sqft": 10000, "cap_rate": 6.0, "state": "TX", "price": 3000000},
        {"property_type": "Industrial", "sqft": 20000, "cap_rate": 7.0, "state": "FL", "price": 4000000}
    ]

    model.train_model(train_data)
    assert model.is_trained == True

    res = model.predict_valuation(property_type="Retail", sqft=5000, city="Austin", state="TX", cap_rate=6.5, list_price=1200000)
    assert res.estimated_price > 0
    assert res.undervaluation_score > 0

def test_semantic_vector_search():
    engine = SemanticVectorSearchEngine()
    docs = [
        {"title": "High Cap Rate Retail Center", "property_type": "Retail", "city": "Austin", "state": "TX", "description": "Triple net retail next to highway"},
        {"title": "Industrial Warehouse Park", "property_type": "Industrial", "city": "Dallas", "state": "TX", "description": "Flex space warehouse with dock high doors"}
    ]

    engine.fit_documents(docs)
    results = engine.search("retail center near highway", top_k=1)
    assert len(results) == 1
    assert "Retail" in results[0]["property_type"]
