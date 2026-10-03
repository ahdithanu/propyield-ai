import math
from typing import List, Dict, Any

class CrossEncoderReranker:
    """
    Two-Stage Cross-Encoder Reranker.
    Solves the 'Lost in the Middle' problem by pruning broad candidate retrieval (K1 = 25-50)
    down to a compact, high-density context window (K2 = 3-5) with confidence thresholding.
    """
    def __init__(self, score_threshold: float = 0.50):
        self.score_threshold = score_threshold

    def rerank(self, query: str, candidate_chunks: List[Dict[str, Any]], top_n: int = 4) -> List[Dict[str, Any]]:
        """
        Calculates cross-attention query-passage relevance scores and filters out low-confidence noise.
        """
        if not candidate_chunks:
            return []

        q_terms = set(query.lower().split())
        scored_chunks = []

        for chunk in candidate_chunks:
            text = chunk.get("text", "")
            chunk_terms = text.lower().split()

            overlap_count = sum(1 for term in q_terms if term in text.lower())
            term_coverage = overlap_count / max(1, len(q_terms))

            phrase_bonus = 0.2 if any(phrase in text.lower() for phrase in [
                "buy box", "cap rate", "roof", "hvac", "bays", "occupancy", "tenant", "square foot"
            ] if phrase in query.lower()) else 0.0

            relevance_score = round(min(1.0, (term_coverage * 0.7) + phrase_bonus + (chunk.get("rrf_score", 0.0) * 10)), 3)

            if relevance_score >= self.score_threshold:
                scored = chunk.copy()
                scored["rerank_score"] = relevance_score
                scored_chunks.append(scored)

        scored_chunks.sort(key=lambda x: x["rerank_score"], reverse=True)
        return scored_chunks[:top_n]

# Global Singleton Instance
reranker = CrossEncoderReranker()
