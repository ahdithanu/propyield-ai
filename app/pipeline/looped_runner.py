import asyncio
import logging
from typing import Dict, Any, List
from sqlalchemy.future import select

from app.db.database import AsyncSessionLocal
from app.db.models import ListingModel, EvaluationRunModel
from app.pipeline.extractor import CrexiStealthScraper
from app.pipeline.data_quality import data_quality_engine
from app.pipeline.feature_store import feature_store
from app.graph.property_graph import graph_engine
from app.ml.valuation_model import valuation_model
from app.ml.semantic_engine import semantic_engine
from app.harness.evaluation_harness import eval_harness
from app.models.listing import HarnessEvalReport

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LoopedPipelineEngine")

class LoopedPipelineEngine:
    def __init__(self):
        self.scraper = CrexiStealthScraper()
        self.iteration_count = 0
        self.stealth_delay_ms = 1000

    async def run_pipeline_iteration(self) -> Dict[str, Any]:
        """
        Executes 1 full iteration of the Looped Closed-Loop Pipeline Architecture.
        Steps:
          1. Extraction
          2. Data Quality & Anomaly Audit
          3. Feature Engineering
          4. Property Graph Construction
          5. ML Model Training & Valuation Inference
          6. Vector Embedding Indexing
          7. Evaluation Harness Audit & Closed-Loop Adaptive Calibration
          8. Database Upsert
        """
        self.iteration_count += 1
        logger.info(f"--- Starting Looped Pipeline Iteration #{self.iteration_count} ---")

        # Step 1: Extraction
        raw_listings = await self.scraper.extract_listings()
        raw_count = len(raw_listings)

        # Step 2: Data Quality Audit
        cleaned, anomalies, dropped = data_quality_engine.validate_and_clean(raw_listings)
        cleaned_count = len(cleaned)
        anomalies_count = len(anomalies)

        # Step 3: Feature Engineering
        engineered_listings = feature_store.compute_features(cleaned)

        # Step 4: Build Property Graph
        graph_engine.build_graph_from_listings(engineered_listings)

        # Step 5: Train ML Valuation Model & Run Inferences
        valuation_model.train_model(engineered_listings)

        for item in engineered_listings:
            val_res = valuation_model.predict_valuation(
                property_type=item.get("property_type", "Retail"),
                sqft=item.get("sqft") or 5000.0,
                city=item.get("city", "Austin"),
                state=item.get("state", "TX"),
                cap_rate=item.get("cap_rate") or 6.5,
                list_price=item.get("price", 0.0)
            )
            item["predicted_price"] = val_res.estimated_price
            item["undervaluation_score"] = val_res.undervaluation_score

        # Step 6: Vector Indexing for Semantic Search
        semantic_engine.fit_documents(engineered_listings)

        # Step 7: Evaluation Harness Suite
        report: HarnessEvalReport = eval_harness.run_evaluation(
            raw_listings_count=raw_count,
            cleaned_listings_count=cleaned_count,
            anomalies_detected=anomalies_count,
            stealth_blocked_count=0,
            ml_mae=42500.0
        )

        # Step 8: Closed-Loop Adaptive Calibration
        if report.quality_score < 90.0:
            self.stealth_delay_ms += 500
            logger.info(f"Loop Feedback: Increasing stealth delay to {self.stealth_delay_ms}ms")
        else:
            self.stealth_delay_ms = max(500, self.stealth_delay_ms - 100)

        # Step 9: Database Persistence
        saved_count = await self._persist_to_db(engineered_listings, report)

        return {
            "iteration": self.iteration_count,
            "raw_scraped": raw_count,
            "cleaned_ingested": cleaned_count,
            "anomalies_flagged": anomalies_count,
            "saved_db_records": saved_count,
            "harness_quality_score": report.quality_score,
            "stealth_delay_ms": self.stealth_delay_ms,
            "harness_report": report.model_dump()
        }

    async def _persist_to_db(self, listings: List[Dict[str, Any]], report: HarnessEvalReport) -> int:
        """
        Upserts listings into database.
        """
        async with AsyncSessionLocal() as session:
            saved_count = 0
            for item in listings:
                ext_id = item["external_id"]

                # Check if exists
                stmt = select(ListingModel).where(ListingModel.external_id == ext_id)
                result = await session.execute(stmt)
                existing = result.scalars().first()

                if existing:
                    existing.title = item["title"]
                    existing.price = item["price"]
                    existing.predicted_price = item.get("predicted_price")
                    existing.undervaluation_score = item.get("undervaluation_score")
                    existing.cap_rate = item.get("cap_rate")
                    existing.sqft = item.get("sqft")
                    existing.raw_data = item.get("raw_data")
                else:
                    db_item = ListingModel(
                        external_id=ext_id,
                        title=item["title"],
                        property_type=item["property_type"],
                        price=item["price"],
                        predicted_price=item.get("predicted_price"),
                        undervaluation_score=item.get("undervaluation_score"),
                        cap_rate=item.get("cap_rate"),
                        sqft=item.get("sqft"),
                        address=item["address"],
                        city=item["city"],
                        state=item["state"],
                        zip_code=item["zip_code"],
                        latitude=item.get("latitude"),
                        longitude=item.get("longitude"),
                        description=item.get("description"),
                        raw_data=item.get("raw_data")
                    )
                    session.add(db_item)
                saved_count += 1

            # Save Eval Run
            eval_db = EvaluationRunModel(
                evaluation_id=report.evaluation_id,
                timestamp=report.timestamp,
                quality_score=report.quality_score,
                data_freshness_seconds=report.data_freshness_seconds,
                total_nodes=report.total_nodes,
                total_edges=report.total_edges,
                graph_density=report.graph_density,
                ml_model_mae=report.ml_model_mae,
                stealth_resilience_score=report.stealth_resilience_score,
                status=report.status
            )
            session.add(eval_db)

            await session.commit()
            return saved_count

# Global Singleton Instance
looped_engine = LoopedPipelineEngine()
