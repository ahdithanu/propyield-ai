import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.ensemble import IsolationForest

class DataQualityEngine:
    def __init__(self, contamination: float = 0.05):
        self.isolation_forest = IsolationForest(contamination=contamination, random_state=42)

    def validate_and_clean(self, raw_listings: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], int]:
        """
        Sanitizes raw listings, drops malformed data, and uses Isolation Forest for pricing anomaly detection.
        Returns: (cleaned_listings, anomalous_listings, dropped_count)
        """
        valid_items = []
        dropped_count = 0

        # Step 1: Basic schema sanitization
        for item in raw_listings:
            if not item.get("external_id") or not item.get("title") or item.get("price") is None:
                dropped_count += 1
                continue

            price = float(item.get("price", 0))
            if price <= 0:
                dropped_count += 1
                continue

            sqft = float(item.get("sqft") or 0)
            cap_rate = float(item.get("cap_rate") or 0)

            cleaned_item = {
                "external_id": str(item["external_id"]),
                "title": str(item["title"]),
                "property_type": str(item.get("property_type", "Retail")),
                "price": price,
                "cap_rate": cap_rate if (0 <= cap_rate <= 100) else None,
                "sqft": sqft if sqft > 0 else None,
                "address": str(item.get("address", "N/A")),
                "city": str(item.get("city", "Unknown")),
                "state": str(item.get("state", "US")).upper()[:2],
                "zip_code": str(item.get("zip_code", "00000")),
                "latitude": float(item["latitude"]) if item.get("latitude") else None,
                "longitude": float(item["longitude"]) if item.get("longitude") else None,
                "description": item.get("description", ""),
                "raw_data": item
            }
            valid_items.append(cleaned_item)

        if not valid_items:
            return [], [], dropped_count

        # Step 2: Isolation Forest Anomaly Detection on (Price, Cap Rate, Sqft)
        features = []
        for item in valid_items:
            price = item["price"]
            cap = item["cap_rate"] if item["cap_rate"] is not None else 6.0
            sqft = item["sqft"] if item["sqft"] is not None else 10000.0
            features.append([price, cap, sqft])

        features_arr = np.array(features)

        if len(features_arr) >= 4:
            self.isolation_forest.fit(features_arr)
            predictions = self.isolation_forest.predict(features_arr) # 1 = normal, -1 = anomaly
        else:
            predictions = np.ones(len(valid_items))

        cleaned_listings = []
        anomalous_listings = []

        for idx, pred in enumerate(predictions):
            if pred == -1:
                anomalous_listings.append(valid_items[idx])
            else:
                cleaned_listings.append(valid_items[idx])

        # Fallback: if all flagged as anomaly, keep all cleaned
        if not cleaned_listings and valid_items:
            cleaned_listings = valid_items

        return cleaned_listings, anomalous_listings, dropped_count

# Global Singleton Instance
data_quality_engine = DataQualityEngine()
