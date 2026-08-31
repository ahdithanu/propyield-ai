from fastapi import APIRouter
from app.api.v1.endpoints import listings, graph_endpoints, harness_endpoints, ml_endpoints, analytics

api_router = APIRouter()

api_router.include_router(listings.router, prefix="/listings", tags=["Listings & Search"])
api_router.include_router(graph_endpoints.router, prefix="/graph", tags=["Graph Engineering"])
api_router.include_router(harness_endpoints.router, prefix="/harness", tags=["Harness Engineering"])
api_router.include_router(ml_endpoints.router, prefix="/ml", tags=["Deep ML Engine"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Market Analytics"])
