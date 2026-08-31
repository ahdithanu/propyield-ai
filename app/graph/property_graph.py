import networkx as nx
from typing import List, Dict, Any, Optional

class PropertyGraphEngine:
    def __init__(self):
        self.graph = nx.Graph()

    def build_graph_from_listings(self, listings: List[Dict[str, Any]]):
        """
        Constructs a Property Graph from listing dictionaries.
        Nodes:
          - Property (ext_<id>)
          - Location (loc_<state>_<city>)
          - Type (type_<property_type>)
        Edges:
          - LOCATED_IN
          - CATEGORIZED_AS
          - SIMILAR_TO (similarity based on price/sqft proximity)
        """
        self.graph.clear()

        # Step 1: Add nodes and spatial edges
        for item in listings:
            p_id = f"property_{item.get('external_id', item.get('id'))}"
            loc_id = f"location_{item.get('state', 'US')}_{item.get('city', 'Unknown')}".replace(" ", "_")
            type_id = f"type_{item.get('property_type', 'General')}".replace(" ", "_")

            # Add Property node
            self.graph.add_node(
                p_id,
                node_type="Property",
                title=item.get("title", ""),
                price=item.get("price", 0),
                cap_rate=item.get("cap_rate", 0),
                sqft=item.get("sqft", 0),
                city=item.get("city", ""),
                state=item.get("state", "")
            )

            # Add Location node
            self.graph.add_node(loc_id, node_type="Location", city=item.get("city"), state=item.get("state"))

            # Add Type node
            self.graph.add_node(type_id, node_type="PropertyType", property_type=item.get("property_type"))

            # Edges
            self.graph.add_edge(p_id, loc_id, relation="LOCATED_IN", weight=1.0)
            self.graph.add_edge(p_id, type_id, relation="CATEGORIZED_AS", weight=1.0)

        # Step 2: Add SIMILAR_TO edges between properties with similar cap rates/pricing
        property_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("node_type") == "Property"]

        for i in range(len(property_nodes)):
            for j in range(i + 1, min(i + 15, len(property_nodes))):
                p1 = property_nodes[i]
                p2 = property_nodes[j]
                d1 = self.graph.nodes[p1]
                d2 = self.graph.nodes[p2]

                # Match location or type
                if d1.get("state") == d2.get("state") or d1.get("property_type") == d2.get("property_type"):
                    price_diff = abs(d1.get("price", 0) - d2.get("price", 0))
                    cap_diff = abs((d1.get("cap_rate") or 0) - (d2.get("cap_rate") or 0))

                    if price_diff < 500000 and cap_diff < 1.5:
                        similarity_weight = round(1.0 / (1.0 + cap_diff), 2)
                        self.graph.add_edge(p1, p2, relation="SIMILAR_TO", weight=similarity_weight)

    def get_neighbors(self, node_id: str, depth: int = 1) -> Dict[str, Any]:
        """
        Multi-hop neighborhood graph traversal.
        """
        if not node_id.startswith("property_"):
            formatted_id = f"property_{node_id}"
        else:
            formatted_id = node_id

        if formatted_id not in self.graph:
            return {"target_property_id": node_id, "neighbors": [], "total_connections": 0}

        neighbors = []
        for neighbor in nx.single_source_shortest_path_length(self.graph, formatted_id, cutoff=depth):
            if neighbor != formatted_id:
                node_data = dict(self.graph.nodes[neighbor])
                edge_data = self.graph.get_edge_data(formatted_id, neighbor) or {}
                node_data["id"] = neighbor
                node_data["relation"] = edge_data.get("relation", "CONNECTED_TO")
                node_data["weight"] = edge_data.get("weight", 1.0)
                neighbors.append(node_data)

        return {
            "target_property_id": node_id,
            "neighbors": neighbors,
            "total_connections": len(neighbors)
        }

    def compute_market_hubs(self, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Computes PageRank centrality to identify top Commercial Real Estate Market Hubs.
        """
        if self.graph.number_of_nodes() == 0:
            return []

        pagerank_scores = nx.pagerank(self.graph)
        sorted_nodes = sorted(pagerank_scores.items(), key=lambda x: x[1], reverse=True)

        market_hubs = []
        for node_id, score in sorted_nodes[:top_k]:
            data = dict(self.graph.nodes[node_id])
            data["node_id"] = node_id
            data["pagerank_score"] = round(score, 4)
            market_hubs.append(data)

        return market_hubs

    def get_graph_metrics(self) -> Dict[str, Any]:
        """
        Returns graph topology metrics.
        """
        n_nodes = self.graph.number_of_nodes()
        n_edges = self.graph.number_of_edges()
        density = nx.density(self.graph) if n_nodes > 1 else 0.0

        return {
            "total_nodes": n_nodes,
            "total_edges": n_edges,
            "graph_density": round(density, 6)
        }

# Global Singleton Instance
graph_engine = PropertyGraphEngine()
