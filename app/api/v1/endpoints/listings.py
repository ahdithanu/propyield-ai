from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.db.database import get_db
from app.db.models import ListingModel
from app.models.listing import ListingResponse, ListingFilterParams
from app.pipeline.looped_runner import looped_engine

router = APIRouter()

@router.get("", response_model=List[ListingResponse])
async def search_listings(
    city: Optional[str] = None,
    state: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_cap_rate: Optional[float] = None,
    max_cap_rate: Optional[float] = None,
    min_sqft: Optional[float] = None,
    max_sqft: Optional[float] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Search and filter CRE properties by city, state, price, cap rate, sqft, and property type.
    Returns clean serialized JSON results in <500ms.
    """
    query = select(ListingModel)

    if city:
        query = query.where(func.lower(ListingModel.city) == city.lower())
    if state:
        query = query.where(func.upper(ListingModel.state) == state.upper())
    if property_type:
        query = query.where(func.lower(ListingModel.property_type) == property_type.lower())
    if min_price is not None:
        query = query.where(ListingModel.price >= min_price)
    if max_price is not None:
        query = query.where(ListingModel.price <= max_price)
    if min_cap_rate is not None:
        query = query.where(ListingModel.cap_rate >= min_cap_rate)
    if max_cap_rate is not None:
        query = query.where(ListingModel.cap_rate <= max_cap_rate)
    if min_sqft is not None:
        query = query.where(ListingModel.sqft >= min_sqft)
    if max_sqft is not None:
        query = query.where(ListingModel.sqft <= max_sqft)

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    listings = result.scalars().all()

    # If DB is empty, run 1 iteration automatically to seed data
    if not listings and page == 1:
        await looped_engine.run_pipeline_iteration()
        result = await db.execute(query)
        listings = result.scalars().all()

    return listings

@router.get("/{id}", response_model=ListingResponse)
async def get_listing(id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieve single property listing details by primary key ID.
    """
    query = select(ListingModel).where(ListingModel.id == id)
    result = await db.execute(query)
    listing = result.scalars().first()

    if not listing:
        raise HTTPException(status_code=404, detail=f"Listing ID {id} not found")

    return listing

@router.post("/trigger-scrape")
async def trigger_pipeline_scrape():
    """
    Triggers an on-demand iteration of the closed-loop ingestion pipeline.
    """
    summary = await looped_engine.run_pipeline_iteration()
    return {"message": "Pipeline iteration completed successfully", "summary": summary}
