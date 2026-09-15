import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.database import init_db
from app.pipeline.extractor import MOCK_CREXI_PROPERTIES
from app.models.listing import ListingResponse

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()

def test_no_generic_stock_photos_in_pipeline():
    """
    Validates the Anti-Stock rule: zero generic Unsplash/stock photo URLs allowed in extractor data.
    """
    for prop in MOCK_CREXI_PROPERTIES:
        image_url = prop.get("image_url")
        if image_url:
            assert "unsplash.com" not in image_url, f"Stock photo found in {prop['external_id']}"
            assert "stock" not in image_url.lower(), f"Stock photo keyword found in {prop['external_id']}"

def test_authentic_geocoding_and_tenant_domain_coverage():
    """
    Validates that commercial listings have coordinates and verified tenant domains for Tier 1-3 resolvers.
    """
    for prop in MOCK_CREXI_PROPERTIES:
        assert prop.get("latitude") is not None, f"Missing latitude for {prop['external_id']}"
        assert prop.get("longitude") is not None, f"Missing longitude for {prop['external_id']}"
        assert -90.0 <= prop["latitude"] <= 90.0
        assert -180.0 <= prop["longitude"] <= 180.0
        assert prop.get("tenant_domain") is not None, f"Missing tenant domain for {prop['external_id']}"
        assert "." in prop["tenant_domain"], f"Invalid domain: {prop['tenant_domain']}"

@pytest.mark.asyncio
async def test_api_returns_authentic_imagery_fields():
    """
    Tests that the listings search API serializes latitude, longitude, tenant_domain, and tenant_name.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/listings?limit=5")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0

    first = data[0]
    assert "latitude" in first
    assert "longitude" in first
    assert "tenant_domain" in first
    assert "tenant_name" in first
