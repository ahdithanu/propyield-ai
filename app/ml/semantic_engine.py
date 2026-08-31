from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class SemanticVectorSearchEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = None
        self.listings: List[Dict[str, Any]] = []

    def fit_documents(self, listings: List[Dict[str, Any]]):
        """
        Indexes listing descriptions and titles into TF-IDF vector embeddings space.
        """
        self.listings = listings
        if not listings:
            return

        documents = [
            f"{item.get('title', '')} {item.get('property_type', '')} {item.get('city', '')} {item.get('state', '')} {item.get('description', '')}"
            for item in listings
        ]

        self.tfidf_matrix = self.vectorizer.fit_transform(documents)

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Vector search matching natural language query string against vector embeddings.
        """
        if self.tfidf_matrix is None or not self.listings:
            return []

        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        top_indices = similarities.argsort()[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = round(float(similarities[idx]), 4)
            if score > 0.0:
                item = self.listings[idx].copy()
                item["semantic_match_score"] = score
                results.append(item)

        # Fallback: if zero score matches, return first top_k
        if not results and self.listings:
            results = [dict(item, semantic_match_score=0.10) for item in self.listings[:top_k]]

        return results

# Global Singleton Instance
semantic_engine = SemanticVectorSearchEngine()
