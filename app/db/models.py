import datetime
import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class OrganizationModel(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=lambda: f"org_{uuid.uuid4().hex[:12]}")
    name = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    subscription_tier = Column(String, default="scout", index=True)  # scout, team, institutional
    monthly_export_limit = Column(Integer, default=100)
    monthly_export_count = Column(Integer, default=0)
    stripe_customer_id = Column(String, nullable=True, index=True)
    stripe_subscription_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("UserModel", back_populates="organization", cascade="all, delete-orphan")

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: f"usr_{uuid.uuid4().hex[:12]}")
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="analyst", index=True)  # admin, acquisition_director, analyst, auditor
    is_active = Column(Boolean, default=True)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    organization = relationship("OrganizationModel", back_populates="users")

class AuditLogModel(Base):
    """
    Immutable, append-only compliance audit ledger for CISO, SOC 2, and regulatory governance.
    """
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: f"aud_{uuid.uuid4().hex[:16]}")
    organization_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=True)
    action = Column(String, index=True, nullable=False)  # AUTH_LOGIN, AUTH_MFA_SUCCESS, DEAL_EXPORT_CSV, etc.
    resource_type = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class ListingModel(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True, nullable=False)
    organization_id = Column(String, index=True, default="org_default")
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
