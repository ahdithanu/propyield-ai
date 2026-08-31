from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ListingBase(BaseModel):
    external_id: str = Field(..., description="Unique external property identifier")
    title: str = Field(..., description="Listing headline title")
    property_type: str = Field("Retail", description="CRE Property Type (Retail, Industrial, Office, Multi-Family, Land)")
    price: float = Field(..., ge=0, description="Listing price in USD")
    cap_rate: Optional[float] = Field(None, ge=0, le=100, description="Capitalization Rate percentage")
    sqft: Optional[float] = Field(None, ge=0, description="Building area in square feet")
    address: str = Field(..., description="Street address")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State 2-letter abbreviation")
    zip_code: str = Field(..., description="Postal code")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None

class ListingCreate(ListingBase):
    raw_data: Optional[Dict[str, Any]] = None

class ListingResponse(ListingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    predicted_price: Optional[float] = None
    undervaluation_score: Optional[float] = None
    scraped_at: datetime

class ListingFilterParams(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    property_type: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_cap_rate: Optional[float] = None
    max_cap_rate: Optional[float] = None
    min_sqft: Optional[float] = None
    max_sqft: Optional[float] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)

class GraphNeighborResponse(BaseModel):
    target_property_id: str
    neighbors: List[Dict[str, Any]]
    total_connections: int

class HarnessEvalReport(BaseModel):
    evaluation_id: str
    timestamp: datetime
    quality_score: float = Field(..., ge=0, le=100)
    data_freshness_seconds: float
    total_nodes: int
    total_edges: int
    graph_density: float
    ml_model_mae: float
    stealth_resilience_score: float
    status: str

class MLValuationRequest(BaseModel):
    property_type: str = "Retail"
    sqft: float = 5000.0
    city: str = "Austin"
    state: str = "TX"
    cap_rate: float = 6.5

class MLValuationResponse(BaseModel):
    estimated_price: float
    estimated_cap_rate: float
    price_per_sqft: float
    confidence_score: float
    undervaluation_score: float
    recommendation: str

class SemanticSearchRequest(BaseModel):
    query: str = "high cap rate retail near highway"
    limit: int = 5
