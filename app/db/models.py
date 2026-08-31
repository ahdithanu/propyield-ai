import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text
from app.db.database import Base

class ListingModel(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, index=True, nullable=False)
    property_type = Column(String, index=True, nullable=False, default="Retail")
    price = Column(Float, index=True, nullable=False)
    predicted_price = Column(Float, nullable=True)
    undervaluation_score = Column(Float, index=True, nullable=True)
    cap_rate = Column(Float, index=True, nullable=True)
    sqft = Column(Float, nullable=True)
    address = Column(String, nullable=False)
    city = Column(String, index=True, nullable=False)
    state = Column(String, index=True, nullable=False)
    zip_code = Column(String, index=True, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    scraped_at = Column(DateTime, default=datetime.datetime.utcnow)
    raw_data = Column(JSON, nullable=True)

class GraphNodeModel(Base):
    __tablename__ = "graph_nodes"

    node_id = Column(String, primary_key=True)
    node_type = Column(String, index=True) # Property, Location, PropertyType, MarketHub
    attributes = Column(JSON, nullable=True)

class GraphEdgeModel(Base):
    __tablename__ = "graph_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(String, index=True, nullable=False)
    target_id = Column(String, index=True, nullable=False)
    relation_type = Column(String, index=True, nullable=False) # LOCATED_IN, SIMILAR_TO, CATEGORIZED_AS
    weight = Column(Float, default=1.0)

class EvaluationRunModel(Base):
    __tablename__ = "pipeline_eval_runs"

    evaluation_id = Column(String, primary_key=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    quality_score = Column(Float, nullable=False)
    data_freshness_seconds = Column(Float, nullable=False)
    total_nodes = Column(Integer, nullable=False)
    total_edges = Column(Integer, nullable=False)
    graph_density = Column(Float, nullable=False)
    ml_model_mae = Column(Float, nullable=False)
    stealth_resilience_score = Column(Float, nullable=False)
    status = Column(String, nullable=False)
