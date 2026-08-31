import sys
import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_db
from app.api.v1.router import api_router
from app.pipeline.looped_runner import looped_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup DB init
    await init_db()
    # Seed initial data iteration
    await looped_engine.run_pipeline_iteration()
    yield

app = FastAPI(
    title="CRE Automated Data Pipeline & Deep ML Search Engine",
    description="Forward Deployed Engineering Portfolio Project: Graph-Engineered, Harness-Engineered, and Deep ML Powered CRE Pipeline & Search API.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["System Health"])
async def health_check():
    return {"status": "HEALTHY", "service": "CRE Data Pipeline & ML Engine", "version": "1.0.0"}

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--run-pipeline":
        print("Running standalone CLI Looped Pipeline Engine iteration...")
        asyncio.run(init_db())
        res = asyncio.run(looped_engine.run_pipeline_iteration())
        print(f"Execution complete! Summary: {res}")
    else:
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
