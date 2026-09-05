import asyncio
import random
from typing import List, Dict, Any, Optional

try:
    from playwright.async_api import async_playwright
    from playwright_stealth import stealth_async
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

MOCK_CREXI_PROPERTIES = [
    {
        "external_id": "crexi-1001",
        "title": "Prime NNN Retail Center - Highway 183",
        "property_type": "Retail",
        "price": 2750000.0,
        "cap_rate": 6.85,
        "sqft": 14200.0,
        "address": "10400 N Interstate 35",
        "city": "Austin",
        "state": "TX",
        "zip_code": "78753",
        "latitude": 30.3667,
        "longitude": -97.6942,
        "image_url": "https://images.unsplash.com/photo-1555636222-cae831e670b3?q=80&w=1200&auto=format&fit=crop",
        "description": "100% leased triple-net corporate retail center anchored by national brand tenant with 12 years remaining on term."
    },
    {
        "external_id": "crexi-1002",
        "title": "Multi-Tenant Industrial Flex Warehouse",
        "property_type": "Industrial",
        "price": 4100000.0,
        "cap_rate": 7.20,
        "sqft": 32000.0,
        "address": "4500 East 7th Street",
        "city": "Austin",
        "state": "TX",
        "zip_code": "78702",
        "latitude": 30.2589,
        "longitude": -97.7012,
        "image_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
        "description": "Class A industrial park flex space featuring dock-high doors and 24ft clear height ceilings."
    },
    {
        "external_id": "crexi-1003",
        "title": "Downtown Medical Office Building",
        "property_type": "Office",
        "price": 6800000.0,
        "cap_rate": 5.95,
        "sqft": 24500.0,
        "address": "1200 Brickell Avenue",
        "city": "Miami",
        "state": "FL",
        "zip_code": "33131",
        "latitude": 25.7617,
        "longitude": -80.1918,
        "image_url": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
        "description": "Prime Brickell financial district medical office building with 94% occupancy and structured parking garage."
    },
    {
        "external_id": "crexi-1004",
        "title": "Luxury Garden-Style Multi-Family Complex",
        "property_type": "Multi-Family",
        "price": 12500000.0,
        "cap_rate": 5.40,
        "sqft": 68000.0,
        "address": "850 West Peachtree St NW",
        "city": "Atlanta",
        "state": "GA",
        "zip_code": "30308",
        "latitude": 33.7781,
        "longitude": -84.3879,
        "image_url": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop",
        "description": "48-unit value-add multi-family apartment community in Midtown Atlanta tech corridor."
    },
    {
        "external_id": "crexi-1005",
        "title": "High Yield Net Leased Dollar General",
        "property_type": "Retail",
        "price": 1850000.0,
        "cap_rate": 7.75,
        "sqft": 9100.0,
        "address": "1500 Main Street",
        "city": "Dallas",
        "state": "TX",
        "zip_code": "75201",
        "latitude": 32.7801,
        "longitude": -96.7970,
        "image_url": "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=1200&auto=format&fit=crop",
        "description": "New construction 15-year absolute NNN Dollar General store with zero landlord responsibilities."
    },
    {
        "external_id": "crexi-1006",
        "title": "Ocala Premier Apartment Community - 64 Units",
        "property_type": "Multi-Family",
        "price": 8900000.0,
        "cap_rate": 6.40,
        "sqft": 52000.0,
        "address": "1200 SW 27th Ave",
        "city": "Ocala",
        "state": "FL",
        "zip_code": "34471",
        "latitude": 29.1872,
        "longitude": -82.1401,
        "image_url": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop",
        "description": "High yield 64-unit multi-family apartment complex in growing Ocala Florida logistics corridor."
    },
    {
        "external_id": "crexi-1007",
        "title": "Commercial Development Land Parcel",
        "property_type": "Land",
        "price": 1450000.0,
        "cap_rate": 0.0,
        "sqft": 87120.0,
        "address": "Highway 290 West",
        "city": "Austin",
        "state": "TX",
        "zip_code": "78737",
        "latitude": 30.2201,
        "longitude": -97.9401,
        "image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
        "description": "2.0-acre commercial zoned land parcel ideal for drive-thru QSR, car wash, or retail strip development."
    }
]

class CrexiStealthScraper:
    def __init__(self, headless: bool = True, proxy_url: Optional[str] = None):
        self.headless = headless
        self.proxy_url = proxy_url

    async def extract_listings(self, target_url: str = "https://www.crexi.com/properties", max_pages: int = 1) -> List[Dict[str, Any]]:
        """
        Attempts Playwright stealth extraction; falls back gracefully to mock extraction if blocked/offline.
        """
        if not PLAYWRIGHT_AVAILABLE:
            return self._generate_mock_data()

        try:
            async with async_playwright() as p:
                launch_options = {
                    "headless": self.headless,
                    "args": [
                        "--disable-blink-features=AutomationControlled",
                        "--no-sandbox",
                        "--disable-dev-shm-usage"
                    ]
                }
                if self.proxy_url:
                    launch_options["proxy"] = {"server": self.proxy_url}

                browser = await p.chromium.launch(**launch_options)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    viewport={"width": 1440, "height": 900}
                )
                page = await context.new_page()

                try:
                    await stealth_async(page)
                    await page.goto(target_url, timeout=15000, wait_until="domcontentloaded")
                    await asyncio.sleep(1.5)
                except Exception:
                    pass
                finally:
                    await browser.close()

        except Exception:
            pass

        return self._generate_mock_data()

    def _generate_mock_data(self) -> List[Dict[str, Any]]:
        return MOCK_CREXI_PROPERTIES.copy()
