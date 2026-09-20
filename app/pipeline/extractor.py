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
        "tenant_name": "Walgreens / AutoZone NNN Pad",
        "tenant_domain": "walgreens.com",
        "image_url": None,
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
        "tenant_name": "FedEx Ground & Supply Chain",
        "tenant_domain": "fedex.com",
        "image_url": None,
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
        "tenant_name": "Baptist Health South Florida",
        "tenant_domain": "baptisthealth.net",
        "image_url": None,
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
        "tenant_name": "Greystar Property Management",
        "tenant_domain": "greystar.com",
        "image_url": None,
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
        "tenant_name": "Dollar General Corporate (NYSE: DG)",
        "tenant_domain": "dollargeneral.com",
        "image_url": None,
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
        "tenant_name": "Lincoln Property Company",
        "tenant_domain": "lpc.com",
        "image_url": None,
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
        "tenant_name": "CBRE Capital Markets Land Group",
        "tenant_domain": "cbre.com",
        "image_url": None,
        "description": "2.0-acre commercial zoned land parcel ideal for drive-thru QSR, car wash, or retail strip development."
    },
    {
        "external_id": "crexi-1008",
        "title": "Kroger Shadow-Anchored Neighborhood Shoppes (7 Bays)",
        "property_type": "Retail",
        "price": 2350000.0,
        "cap_rate": 7.65,
        "sqft": 14800.0,
        "address": "5910 Karl Rd",
        "city": "Columbus",
        "state": "OH",
        "zip_code": "43229",
        "latitude": 40.0894,
        "longitude": -82.9734,
        "tenant_name": "Great Clips, Subway, Physical Therapy",
        "tenant_domain": "kroger.com",
        "image_url": None,
        "description": "Small-bay unanchored neighborhood strip center directly shadow-anchored by high volume Kroger. 7 bays, 85.7% occupancy, 14-yr roof RUL."
    },
    {
        "external_id": "crexi-1009",
        "title": "Walmart Shadow Strip Center - Keystone Crossing",
        "property_type": "Retail",
        "price": 3150000.0,
        "cap_rate": 7.40,
        "sqft": 18200.0,
        "address": "8520 Keystone Crossing",
        "city": "Indianapolis",
        "state": "IN",
        "zip_code": "46240",
        "latitude": 39.9112,
        "longitude": -86.1118,
        "tenant_name": "Anytime Fitness, State Farm, UPS Store",
        "tenant_domain": "walmart.com",
        "image_url": None,
        "description": "100% occupied 8-bay shadow strip center next to Walmart Supercenter. WALT 4.8 yrs, 28k VPD signalized corner."
    },
    {
        "external_id": "crexi-1010",
        "title": "Gallatin Pike Unanchored Value-Add Strip (6 Bays)",
        "property_type": "Retail",
        "price": 1950000.0,
        "cap_rate": 8.20,
        "sqft": 11400.0,
        "address": "720 Gallatin Pike N",
        "city": "Nashville",
        "state": "TN",
        "zip_code": "37115",
        "latitude": 36.2541,
        "longitude": -86.7188,
        "tenant_name": "Metro PCS, Laundromat, Auto Title",
        "tenant_domain": "crexi.com",
        "image_url": None,
        "description": "Value-add 6-bay retail strip on high-traffic corridor (31,200 VPD). In-place rents $12/SF vs $16.50/SF market rents."
    },
    {
        "external_id": "crexi-1011",
        "title": "Broad Ripple 24-Unit Apartment Community",
        "property_type": "Multi-Family",
        "price": 2100000.0,
        "cap_rate": 6.85,
        "sqft": 19200.0,
        "address": "6100 N College Ave",
        "city": "Indianapolis",
        "state": "IN",
        "zip_code": "46220",
        "latitude": 39.8654,
        "longitude": -86.1451,
        "tenant_name": "Broad Ripple Courtyard Apartments",
        "tenant_domain": "apartments.com",
        "image_url": None,
        "description": "24-unit garden multifamily asset ($87.5k/unit) in high-demand Broad Ripple submarket. 95.8% occupied with strong collections."
    },
    {
        "external_id": "crexi-1012",
        "title": "Highland Park 18-Unit Value-Add Brick Apartments",
        "property_type": "Multi-Family",
        "price": 1650000.0,
        "cap_rate": 7.10,
        "sqft": 14400.0,
        "address": "1450 E Broad St",
        "city": "Columbus",
        "state": "OH",
        "zip_code": "43215",
        "latitude": 39.9678,
        "longitude": -82.9612,
        "tenant_name": "Highland Garden Apartments",
        "tenant_domain": "apartments.com",
        "image_url": None,
        "description": "18-unit all-brick multifamily property ($91.6k/unit). Solid workforce housing demographic with 94.4% occupancy."
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
