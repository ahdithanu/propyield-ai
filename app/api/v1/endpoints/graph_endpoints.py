from fastapi import APIRouter, Query
from app.graph.property_graph import graph_engine
from app.models.listing import GraphNeighborResponse

router = APIRouter()

@router.get("/neighbors/{property_id}", response_model=GraphNeighborResponse)
async def get_graph_neighbors(property_id: str, depth: int = Query(1, ge=1, le=3)):
    """
    Multi-hop Graph Engineering endpoint: traverses graph topology to find connected properties, location nodes, and category nodes.
    """
    return graph_engine.get_neighbors(property_id, depth=depth)

@router.get("/market-hubs")
async def get_market_hubs(top_k: int = Query(5, ge=1, le=20)):
    """
    Graph Analytics PageRank Centrality endpoint: identifies high-impact Commercial Real Estate Market Hubs.
    """
    return {
        "market_hubs": graph_engine.compute_market_hubs(top_k=top_k),
        "graph_topology_metrics": graph_engine.get_graph_metrics()
    }
