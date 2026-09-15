import sys
import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_db
from app.db.init_data import seed_default_organization_and_users
from app.api.v1.router import api_router
from app.pipeline.looped_runner import looped_engine
from app.core.config import settings
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup DB tables init
    await init_db()
    # 2. Seed default enterprise organization & role accounts
    await seed_default_organization_and_users()
    # 3. Seed initial pipeline iteration if needed
    try:
        await looped_engine.run_pipeline_iteration()
    except Exception as e:
        print(f"Initial pipeline sync notice: {e}")
    yield

app = FastAPI(
    title="PropYield AI - Enterprise Commercial Real Estate Engine",
    description="Enterprise AI Commercial Real Estate Market Intelligence, Property Graph Analytics, Deep ML Deal Valuation, and Secure Search API.",
    version="1.0.0",
    lifespan=lifespan
)

# 1. Security Headers (HSTS, Anti-clickjack, nosniff, etc.)
app.add_middleware(SecurityHeadersMiddleware)

# 2. Rate Limiting (DoS and brute-force auth defense)
app.add_middleware(RateLimitMiddleware, global_limit=200, auth_limit=20)

# 3. CORS Policy
cors_origins = settings.CORS_ALLOWED_ORIGINS if (settings.ENVIRONMENT == "production" and settings.CORS_ALLOWED_ORIGINS) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["System Health"])
@app.get("/api/v1/health", tags=["System Health"])
async def health_check():
    return {"status": "HEALTHY", "service": "CRE Data Pipeline & ML Engine", "version": "1.0.0"}

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--run-pipeline":
        print("Running standalone CLI Looped Pipeline Engine iteration...")
        asyncio.run(init_db())
        res = asyncio.run(looped_engine.run_pipeline_iteration())
        print(f"Execution complete! Summary: {res}")
    else:
        import os
        port = int(os.environ.get("PORT", 8000))
        uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
