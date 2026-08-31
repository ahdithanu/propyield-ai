import pandas as pd
from typing import List, Dict, Any

class FeatureStore:
    def __init__(self):
        self.market_benchmarks: Dict[str, Any] = {}

    def compute_features(self, listings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Computes engineered features: price_per_sqft, state_avg_cap_rate, valuation_ratio.
        """
        if not listings:
            return []

        df = pd.DataFrame(listings)

        # Compute price_per_sqft
        df["price_per_sqft"] = df.apply(
            lambda r: round(r["price"] / r["sqft"], 2) if (r.get("sqft") and r["sqft"] > 0) else 0.0,
            axis=1
        )

        # Compute state average cap rate
        state_cap_means = df.groupby("state")["cap_rate"].mean().to_dict()
        df["state_avg_cap_rate"] = df["state"].map(state_cap_means).fillna(6.5).round(2)

        # Update internal benchmarks
        self.market_benchmarks = {
            "state_cap_means": state_cap_means,
            "overall_median_price_per_sqft": float(df["price_per_sqft"].median()) if not df.empty else 250.0
        }

        return df.to_dict(orient="records")

# Global Singleton Instance
feature_store = FeatureStore()
