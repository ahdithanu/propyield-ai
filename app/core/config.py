import os
from typing import List
from pydantic_settings import BaseSettings

def _parse_origins(raw: str | None) -> List[str]:
    if not raw:
        return []
    items: List[str] = []
    for part in raw.replace("\n", ",").split(","):
        stripped = part.strip().rstrip("/")
        if stripped:
            items.append(stripped)
    return items

class Settings(BaseSettings):
    PROJECT_NAME: str = "PropYield AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
    
    # Cryptographic JWT parameters
    SECRET_KEY: str = os.getenv("SECRET_KEY", "propyield-insecure-dev-secret-change-in-production-64char")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))
    
    # Guest / Demo sandbox support
    DEMO_MODE_ALLOWED: bool = os.getenv("DEMO_MODE_ALLOWED", "true").lower() in ("true", "1", "yes")
    
    # CORS Configuration
    _DEFAULT_DEV_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8000,http://localhost:8080"
    CORS_ALLOWED_ORIGINS: List[str] = _parse_origins(
        os.getenv("CORS_ALLOWED_ORIGINS", _DEFAULT_DEV_ORIGINS if os.getenv("ENVIRONMENT", "development").lower() != "production" else "")
    )
    
    # Monetization & Stripe
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock_key")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_mock_key")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./crexi_realestate.db")

    class Config:
        case_sensitive = True

settings = Settings()

# Fail-fast security validation for production deployments
if settings.ENVIRONMENT == "production":
    if settings.SECRET_KEY.startswith("propyield-insecure"):
        raise RuntimeError("FATAL: SECRET_KEY must be configured with a high-entropy secret when ENVIRONMENT=production")
    if "*" in settings.CORS_ALLOWED_ORIGINS:
        raise RuntimeError("FATAL: Wildcard '*' is forbidden in CORS_ALLOWED_ORIGINS when ENVIRONMENT=production")
