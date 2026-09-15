import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import timedelta

from app.main import app
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_token,
    generate_mfa_secret,
    verify_mfa_code,
)
from app.db.database import init_db
from app.db.init_data import seed_default_organization_and_users
import pyotp

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    await seed_default_organization_and_users()

@pytest.mark.asyncio
async def test_password_hashing():
    raw = "CISOSecret99#!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

@pytest.mark.asyncio
async def test_jwt_token_claims_and_expiry():
    token = create_access_token(
        subject="usr_test_123",
        organization_id="org_alpha",
        role="acquisition_director",
        expires_delta=timedelta(minutes=5)
    )
    claims = decode_token(token)
    assert claims["sub"] == "usr_test_123"
    assert claims["org"] == "org_alpha"
    assert claims["role"] == "acquisition_director"
    assert claims["type"] == "access"

@pytest.mark.asyncio
async def test_totp_mfa_flow():
    secret = generate_mfa_secret()
    assert len(secret) == 32
    totp = pyotp.TOTP(secret)
    valid_code = totp.now()
    assert verify_mfa_code(secret, valid_code) is True
    assert verify_mfa_code(secret, "000000") is False

@pytest.mark.asyncio
async def test_security_headers_present():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains"
        assert res.headers.get("X-Frame-Options") == "DENY"
        assert res.headers.get("X-Content-Type-Options") == "nosniff"
        assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert "X-RateLimit-Limit" in res.headers

@pytest.mark.asyncio
async def test_user_registration_and_login_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register new fund
        import time
        unique_email = f"alex_{int(time.time() * 1000)}@blackstone.com"
        reg_payload = {
            "organization_name": "Blackstone Horizon Fund",
            "full_name": "Alexander Sterling",
            "email": unique_email,
            "password": "SecurePass2026!"
        }
        reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
        assert reg_res.status_code == 200
        data = reg_res.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["subscription_tier"] == "scout"

        # 2. Login with registered user
        login_res = await client.post("/api/v1/auth/login", json={
            "email": reg_payload["email"],
            "password": "SecurePass2026!"
        })
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

@pytest.mark.asyncio
async def test_rbac_audit_log_access():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as admin
        admin_login = await client.post("/api/v1/auth/login", json={
            "email": "admin@propyield.ai",
            "password": "Password123!"
        })
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]

        # Admin can access audit logs
        audit_res = await client.get(
            "/api/v1/audit/logs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert audit_res.status_code == 200
        assert "audit_logs" in audit_res.json()

        # Login as analyst
        analyst_login = await client.post("/api/v1/auth/login", json={
            "email": "analyst@propyield.ai",
            "password": "Password123!"
        })
        assert analyst_login.status_code == 200
        analyst_token = analyst_login.json()["access_token"]

        # Analyst is forbidden from viewing CISO audit logs
        analyst_res = await client.get(
            "/api/v1/audit/logs",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        assert analyst_res.status_code == 403

@pytest.mark.asyncio
async def test_billing_subscription_and_upgrade():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        admin_login = await client.post("/api/v1/auth/login", json={
            "email": "admin@propyield.ai",
            "password": "Password123!"
        })
        admin_token = admin_login.json()["access_token"]

        # Get subscription
        sub_res = await client.get(
            "/api/v1/billing/subscription",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert sub_res.status_code == 200
        assert "available_plans" in sub_res.json()

        # Upgrade tier
        upgrade_res = await client.post(
            "/api/v1/billing/checkout",
            json={"target_tier": "team"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert upgrade_res.status_code == 200
        assert upgrade_res.json()["tier"] == "team"
