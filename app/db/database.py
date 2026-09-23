import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./crexi_realestate.db")

# Ensure sqlite engine compatibility
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_async_engine(DATABASE_URL, connect_args=connect_args, echo=False)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

from sqlalchemy import text

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Schema migration helper for existing SQLite databases
        # Query existing columns in 'listings' table
        try:
            res = await conn.execute(text("PRAGMA table_info(listings)"))
            existing_cols = {row[1] for row in res.fetchall()}
        except Exception:
            existing_cols = set()

        # Columns added in subsequent feature releases
        column_definitions = {
            "organization_id": "VARCHAR(64) DEFAULT 'org_default'",
            "tenant_domain": "VARCHAR(128)",
            "tenant_name": "VARCHAR(128)",
            "bays_count": "INTEGER",
            "anchor_type": "VARCHAR(64)",
            "shadow_anchor_name": "VARCHAR(128)",
            "occupancy_pct": "FLOAT",
            "max_tenant_pct": "FLOAT",
            "restaurant_pct": "FLOAT",
            "service_tenant_pct": "FLOAT",
            "roof_type": "VARCHAR(64)",
            "roof_age_years": "INTEGER",
            "roof_rul_years": "INTEGER",
            "roof_replacement_est": "FLOAT",
            "hvac_units_count": "INTEGER",
            "hvac_avg_age_years": "INTEGER",
            "hvac_over_12yr_count": "INTEGER",
            "hvac_replacement_est": "FLOAT",
            "parking_stalls": "INTEGER",
            "parking_ratio": "FLOAT",
            "parking_condition": "VARCHAR(64)",
            "parking_reseal_est": "FLOAT",
            "traffic_vpd": "INTEGER",
            "intersection_type": "VARCHAR(128)",
            "lease_structure": "VARCHAR(64)",
            "walt_years": "FLOAT",
            "unit_count": "INTEGER",
            "price_per_unit": "FLOAT",
        }

        for col, col_type in column_definitions.items():
            if col not in existing_cols:
                try:
                    await conn.execute(text(f"ALTER TABLE listings ADD COLUMN {col} {col_type}"))
                except Exception:
                    pass

