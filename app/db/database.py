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
        # Migrate columns if SQLite table existed prior to enterprise schema upgrade
        try:
            await conn.execute(text("ALTER TABLE listings ADD COLUMN organization_id VARCHAR(64) DEFAULT 'org_default'"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE listings ADD COLUMN tenant_domain VARCHAR(128)"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE listings ADD COLUMN tenant_name VARCHAR(128)"))
        except Exception:
            pass

