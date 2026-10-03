import re
import time
from typing import Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class IntentType:
    PROPERTY_SEARCH = "PROPERTY_SEARCH"
    DEAL_UNDERWRITE = "DEAL_UNDERWRITE"
    MARKET_ANALYTICS = "MARKET_ANALYTICS"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"

# Canonical anchor exemplars for fast enterprise routing
INTENT_EXEMPLARS = {
    IntentType.PROPERTY_SEARCH: [
        "find retail properties in Texas with high cap rate",
        "show me commercial real estate strip centers",
        "search for industrial warehouses under 5 million dollars",
        "show listings in Columbus Ohio with 8 bays",
        "properties with Walmart or Kroger shadow anchor",
        "multifamily apartment buildings in Atlanta 16 to 32 units",
        "filter properties by price and cap rate",
        "look up commercial deals in Florida"
    ],
    IntentType.DEAL_UNDERWRITE: [
        "underwrite this deal with 6 bays and asking price 2 million",
        "what is my strike price after roof and hvac capex deductions",
        "evaluate this property against our buy box criteria",
        "calculate loi offer price for retail center",
        "audit remaining useful life of tpo roof and rtu units",
        "check tenant concentration risk and restaurant percentage",
        "is 85 percent occupancy a good value add opportunity",
        "run buy box scorecard on this commercial asset"
    ],
    IntentType.MARKET_ANALYTICS: [
        "what is the average cap rate in Austin Texas",
        "show market graph topology and corridor pagerank",
        "what are median rents per square foot in Indianapolis",
        "market trends and inventory distribution across sunbelt",
        "compare secondary market capitalization rates in Midwest",
        "export market comps and valuation data"
    ],
    IntentType.OUT_OF_SCOPE: [
        "what is the weather in Dallas today",
        "tell me a joke or write a poem",
        "who won the football game last night",
        "how do I bake a chocolate cake",
        "can you help me write javascript code for my website",
        "what is the capital of France",
        "what stocks should I buy right now",
        "what is the temperature outside right now"
    ]
}

class FastIntentClassifier:
    """
    Sub-20ms Edge Intent Classifier & Routing Engine.
    Prevents off-topic / out-of-scope prompts (e.g. weather, general chat)
    from burning expensive LLM token costs or triggering heavy RAG pipelines.
    """
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
        self.intent_labels = []
        corpus = []

        for intent, phrases in INTENT_EXEMPLARS.items():
            for phrase in phrases:
                self.intent_labels.append(intent)
                corpus.append(phrase)

        self.matrix = self.vectorizer.fit_transform(corpus)

        # Common deterministic regex signatures for immediate fast-path deflection (<1ms)
        self.out_of_scope_patterns = [
            re.compile(r"\b(weather|temperature|forecast|rain|snow)\b", re.IGNORECASE),
            re.compile(r"\b(joke|riddle|poem|song|story)\b", re.IGNORECASE),
            re.compile(r"\b(recipe|cook|bake|movie|celebrity|sports|nfl|nba)\b", re.IGNORECASE)
        ]

    def classify(self, text: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        normalized = text.strip()

        # Fast-Path 1: Instant deterministic regex match (<1ms)
        for pattern in self.out_of_scope_patterns:
            if pattern.search(normalized):
                latency_ms = round((time.perf_counter() - start_time) * 1000, 3)
                return {
                    "intent": IntentType.OUT_OF_SCOPE,
                    "confidence": 0.99,
                    "latency_ms": latency_ms,
                    "fast_path": True,
                    "should_divert": True,
                    "canned_response": "I am PropYield AI's commercial real estate underwriting copilot. I specialize in commercial property search, buy box underwriting, and market analytics. I cannot answer weather or general queries."
                }

        # Fast-Path 2: Vector similarity routing against intent clusters (<10ms)
        query_vec = self.vectorizer.transform([normalized])
        similarities = cosine_similarity(query_vec, self.matrix).flatten()

        best_idx = int(np.argmax(similarities))
        max_score = float(similarities[best_idx])
        detected_intent = self.intent_labels[best_idx]

        latency_ms = round((time.perf_counter() - start_time) * 1000, 3)

        # Confidence calibration
        confidence = round(max(0.1, min(0.99, max_score * 1.5)), 2)
        should_divert = (detected_intent == IntentType.OUT_OF_SCOPE) or (max_score < 0.08)

        canned = None
        if should_divert:
            canned = "I am PropYield AI's commercial real estate underwriting copilot. I specialize in commercial property search, buy box underwriting, and market analytics. Please provide a commercial real estate property, market, or underwriting inquiry."

        return {
            "intent": detected_intent if max_score >= 0.08 else IntentType.OUT_OF_SCOPE,
            "confidence": confidence,
            "similarity_score": round(max_score, 4),
            "latency_ms": latency_ms,
            "fast_path": False,
            "should_divert": should_divert,
            "canned_response": canned
        }

# Global Singleton Instance
intent_classifier = FastIntentClassifier()
