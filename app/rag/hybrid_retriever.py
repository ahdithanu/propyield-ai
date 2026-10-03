import re
import math
from typing import List, Dict, Any, Optional

class HybridRAGRetriever:
    """
    Enterprise Dense + Sparse Hybrid Retriever with Reciprocal Rank Fusion (RRF)
    and Zero-Trust RBAC Metadata Pre-Filtering.
    """
    def __init__(self, rrf_k: int = 60):
        self.rrf_k = rrf_k
        self.corpus: List[Dict[str, Any]] = []
        self.bm25_doc_tokens: List[List[str]] = []
        self.doc_freqs: Dict[str, int] = {}
        self.avg_doc_len: float = 0.0

    def index_documents(self, documents: List[Dict[str, Any]]):
        """
        Builds sparse BM25 index and dense corpus reference.
        Each document schema:
          {
            "chunk_id": str,
            "text": str,
            "document_name": str,
            "organization_id": str,
            "allowed_roles": List[str],
            "metadata": dict
          }
        """
        self.corpus = documents
        self.bm25_doc_tokens = []
        self.doc_freqs = {}
        total_len = 0

        for doc in documents:
            tokens = self._tokenize(doc["text"])
            self.bm25_doc_tokens.append(tokens)
            total_len += len(tokens)
            for token in set(tokens):
                self.doc_freqs[token] = self.doc_freqs.get(token, 0) + 1

        self.avg_doc_len = total_len / max(1, len(documents))

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"\w+", text.lower())

    def _score_bm25(self, query_tokens: List[str], doc_idx: int, k1: float = 1.5, b: float = 0.75) -> float:
        doc_tokens = self.bm25_doc_tokens[doc_idx]
        doc_len = len(doc_tokens)
        score = 0.0
        doc_token_counts = {}
        for t in doc_tokens:
            doc_token_counts[t] = doc_token_counts.get(t, 0) + 1

        N = len(self.corpus)
        for q in query_tokens:
            if q not in self.doc_freqs:
                continue
            df = self.doc_freqs[q]
            idf = math.log((N - df + 0.5) / (df + 0.5) + 1.0)
            tf = doc_token_counts.get(q, 0)
            numerator = tf * (k1 + 1.0)
            denominator = tf + k1 * (1.0 - b + b * (doc_len / max(1.0, self.avg_doc_len)))
            score += idf * (numerator / max(0.001, denominator))
        return score

    def _score_dense_similarity(self, query: str, doc_text: str) -> float:
        """
        Lexical-semantic dense approximation simulating text-embedding cosine distance.
        In external cloud deployments, this calls text-embedding-3-small or Cohere Embed v3.
        """
        q_tokens = set(self._tokenize(query))
        d_tokens = set(self._tokenize(doc_text))
        if not q_tokens or not d_tokens:
            return 0.0
        overlap = len(q_tokens.intersection(d_tokens))
        return overlap / math.sqrt(len(q_tokens) * len(d_tokens))

    def retrieve(
        self,
        query: str,
        user_org_id: str,
        user_role: str,
        top_k: int = 25
    ) -> List[Dict[str, Any]]:
        """
        Two-Way Search with RBAC Pre-Filtering and Reciprocal Rank Fusion (RRF):
          RRF_Score(d) = 1 / (60 + Rank_dense(d)) + 1 / (60 + Rank_bm25(d))
        """
        if not self.corpus:
            return []

        # Step 1: Deterministic RBAC Pre-Filter (Zero unauthorized chunks can ever match)
        authorized_indices = []
        for idx, doc in enumerate(self.corpus):
            doc_org = doc.get("organization_id", "org_default")
            doc_roles = doc.get("allowed_roles", ["analyst", "acquisition_director", "admin"])

            # Strict tenant isolation
            if doc_org != user_org_id and doc_org != "org_default":
                continue
            # Role clearance check
            if user_role not in doc_roles and "admin" not in user_role:
                continue
            authorized_indices.append(idx)

        if not authorized_indices:
            return []

        query_tokens = self._tokenize(query)

        # Step 2: Calculate Sparse BM25 Rankings
        bm25_scores = []
        for idx in authorized_indices:
            score = self._score_bm25(query_tokens, idx)
            bm25_scores.append((idx, score))
        bm25_scores.sort(key=lambda x: x[1], reverse=True)
        bm25_rank = {doc_idx: rank for rank, (doc_idx, _) in enumerate(bm25_scores)}

        # Step 3: Calculate Dense Semantic Rankings
        dense_scores = []
        for idx in authorized_indices:
            score = self._score_dense_similarity(query, self.corpus[idx]["text"])
            dense_scores.append((idx, score))
        dense_scores.sort(key=lambda x: x[1], reverse=True)
        dense_rank = {doc_idx: rank for rank, (doc_idx, _) in enumerate(dense_scores)}

        # Step 4: Reciprocal Rank Fusion (RRF)
        fused_results = []
        for idx in authorized_indices:
            r_sparse = bm25_rank.get(idx, len(authorized_indices))
            r_dense = dense_rank.get(idx, len(authorized_indices))
            rrf_score = (1.0 / (self.rrf_k + r_sparse)) + (1.0 / (self.rrf_k + r_dense))

            item = self.corpus[idx].copy()
            item["rrf_score"] = round(rrf_score, 6)
            item["bm25_rank"] = r_sparse
            item["dense_rank"] = r_dense
            fused_results.append(item)

        fused_results.sort(key=lambda x: x["rrf_score"], reverse=True)
        return fused_results[:top_k]

# Global Singleton Instance
hybrid_retriever = HybridRAGRetriever()
