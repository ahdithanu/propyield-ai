from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.database import get_db
from app.db.models import ListingModel
from app.models.listing import MLValuationRequest, MLValuationResponse, SemanticSearchRequest, ListingResponse
from app.ml.valuation_model import valuation_model
from app.ml.semantic_engine import semantic_engine
from app.pipeline.looped_runner import looped_engine

router = APIRouter()

@router.post("/predict-price", response_model=MLValuationResponse)
async def predict_property_valuation(request: MLValuationRequest):
    """
    Deep ML Valuation Endpoint: predicts fair market price, price/sqft, expected cap rate, and undervaluation deal score.
    """
    return valuation_model.predict_valuation(
        property_type=request.property_type,
        sqft=request.sqft,
        city=request.city,
        state=request.state,
        cap_rate=request.cap_rate
    )

@router.post("/semantic-search")
async def semantic_vector_search(request: SemanticSearchRequest):
    """
    Deep ML Vector Search Endpoint: natural language semantic search matching text queries against TF-IDF embeddings space.
    """
    results = semantic_engine.search(query=request.query, top_k=request.limit)
    if not results:
        # Re-index if empty
        await looped_engine.run_pipeline_iteration()
        results = semantic_engine.search(query=request.query, top_k=request.limit)
    return {"query": request.query, "total_matches": len(results), "results": results}

@router.get("/deals", response_model=List[ListingResponse])
async def get_top_deals(limit: int = Query(5, ge=1, le=20), db: AsyncSession = Depends(get_db)):
    """
    Deep ML Investment Opportunities: retrieves top property deals with highest Undervaluation Scores.
    """
    query = select(ListingModel).order_by(ListingModel.undervaluation_score.desc()).limit(limit)
    result = await db.execute(query)
    listings = result.scalars().all()

    if not listings:
        await looped_engine.run_pipeline_iteration()
        result = await db.execute(query)
        listings = result.scalars().all()

    return listings
