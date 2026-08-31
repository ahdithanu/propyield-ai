from app.graph.property_graph import PropertyGraphEngine

def test_property_graph_building_and_hubs():
    engine = PropertyGraphEngine()
    sample_data = [
        {"external_id": "101", "title": "Retail Hub", "property_type": "Retail", "price": 1000000, "cap_rate": 6.5, "city": "Austin", "state": "TX"},
        {"external_id": "102", "title": "Industrial Park", "property_type": "Industrial", "price": 2000000, "cap_rate": 7.0, "city": "Austin", "state": "TX"},
        {"external_id": "103", "title": "Retail Strip", "property_type": "Retail", "price": 1200000, "cap_rate": 6.8, "city": "Dallas", "state": "TX"}
    ]

    engine.build_graph_from_listings(sample_data)
    metrics = engine.get_graph_metrics()

    assert metrics["total_nodes"] > 0
    assert metrics["total_edges"] > 0

    hubs = engine.compute_market_hubs(top_k=2)
    assert len(hubs) == 2

    neighbors = engine.get_neighbors("101", depth=1)
    assert neighbors["target_property_id"] == "101"
    assert neighbors["total_connections"] > 0
