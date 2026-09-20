import retail from "@/assets/cre-retail.jpg";
import industrial from "@/assets/cre-industrial.jpg";
import office from "@/assets/cre-office.jpg";
import multifamily from "@/assets/cre-multifamily.jpg";

import type { Listing, MarketHub, MarketSummary, PredictionInput, PredictionResult } from "./types";

export const TYPE_IMAGE: Record<string, string> = {
  Retail: retail,
  Industrial: industrial,
  Office: office,
  "Multi-Family": multifamily,
  Land: industrial,
};

function build(
  id: string,
  title: string,
  city: string,
  state: string,
  zip: string,
  type: string,
  price: number,
  cap: number,
  sqft: number,
  score: number,
  address: string,
  latitude: number,
  longitude: number,
  tenant_name?: string,
  tenant_domain?: string,
  parcel_id?: string,
  lot_size_acres?: number,
  zoning_code?: string,
  county?: string,
  county_gis_url?: string,
  customImage?: string,
  buyBoxFields?: Partial<Listing>
): Listing {
  const undervaluation = (score - 50) * 0.4;
  const predicted = Math.round(price * (1 + undervaluation / 100));
  const lot_sqft = lot_size_acres ? Math.round(lot_size_acres * 43560) : null;
  return {
    id,
    title,
    address,
    city,
    state,
    zip,
    property_type: type,
    listing_price: price,
    cap_rate: cap,
    sqft,
    price_per_sqft: Number((price / sqft).toFixed(2)),
    deal_score: score,
    ml_predicted_price: predicted,
    undervaluation_pct: Number(undervaluation.toFixed(1)),
    image_url: customImage ?? null,
    latitude,
    longitude,
    tenant_name: tenant_name ?? null,
    tenant_domain: tenant_domain ?? null,
    parcel_id: parcel_id ?? null,
    lot_size_acres: lot_size_acres ?? null,
    lot_size_sqft: lot_sqft,
    zoning_code: zoning_code ?? null,
    county: county ?? null,
    county_gis_url: county_gis_url ?? null,
    year_built: 1998 + (Number(id.replace(/\D/g, "")) % 25),
    noi: Math.round((price * cap) / 100),
    description:
      "Institutional-quality asset in a high-velocity submarket with durable tenancy and below-replacement-cost basis.",
    external_url: `https://www.crexi.com/properties?search=${encodeURIComponent(title)}`,
    ...buyBoxFields,
  };
}

export const FIXTURE_LISTINGS: Listing[] = [
  build("p-1", "Prime NNN Retail Center - Highway 183", "Austin", "TX", "78753", "Retail", 2750000, 6.85, 14200, 84, "8214 Research Blvd", 30.3667, -97.6942, "Walgreens / AutoZone NNN Pad", "walgreens.com", "02-4412-0104-0000", 1.45, "CS-1-NP Commercial Services", "Travis Central Appraisal District", "https://stage.traviscad.org/propertysearch/"),
  build("p-2", "Class A Distribution Warehouse - Grand Pkwy", "Houston", "TX", "77433", "Industrial", 8450000, 7.4, 96500, 91, "21400 Clay Rd", 29.8315, -95.7725, "FedEx Supply Chain Logistics", "fedex.com", "114-892-001-0002", 5.82, "I-1 Light Industrial Logistics", "Harris County Appraisal District", "https://hcad.org/property-search"),
  build("p-3", "Brickell Medical Office Condo", "Miami", "FL", "33131", "Office", 4120000, 5.9, 18300, 62, "1450 Brickell Ave", 25.7617, -80.1918, "Baptist Health South Florida", "baptisthealth.net", "01-4138-042-0110", 0.88, "T6-48b-O Urban Core Medical", "Miami-Dade Property Appraiser", "https://www.miamidade.gov/pa/property_search.asp"),
  build("p-4", "Sunbelt Garden Apartments - 84 Units", "Atlanta", "GA", "30318", "Multi-Family", 12600000, 6.1, 78400, 76, "1201 Marietta St NW", 33.7812, -84.4124, "Greystar Residential Services", "greystar.com", "14-0112-0004-082-1", 3.92, "RG-4 Multi-Family Residential", "Fulton County Board of Assessors", "https://qpublic.schneidercorp.com/Application.aspx?AppID=936"),
  build("p-5", "Single-Tenant Auto Service - I-35 Frontage", "San Antonio", "TX", "78216", "Retail", 1950000, 7.85, 8600, 88, "9950 San Pedro Ave", 29.5312, -98.4981, "Firestone Complete Auto Care", "firestonecompleteautocare.com", "12044-002-0190", 1.12, "C-3 General Commercial", "Bexar Appraisal District", "https://www.bexaracad.org/"),
  build("p-6", "Infill Development Land - 4.2 Acres", "Tampa", "FL", "33607", "Land", 3200000, 4.2, 182000, 54, "4300 W Cypress St", 27.9525, -82.5182, "Cushman & Wakefield Commercial", "cushmanwakefield.com", "108422-0000", 4.20, "CI Commercial Intensive", "Hillsborough County Property Appraiser", "https://www.hcpafl.org/"),
  build("p-7", "Creative Loft Office Campus", "Los Angeles", "CA", "90013", "Office", 15750000, 5.2, 62800, 41, "820 E 3rd St", 34.0458, -118.2341, "JLL Capital Markets Group", "jll.com", "5163-018-024", 1.95, "M3 Heavy Commercial & Arts", "Los Angeles County Assessor", "https://portal.assessor.lacounty.gov/"),
  build("p-8", "Last-Mile Logistics Hub", "Jacksonville", "FL", "32218", "Industrial", 6300000, 7.95, 74200, 93, "1155 Busch Dr", 30.4328, -81.6582, "Amazon Freight Distribution Hub", "amazon.com", "107412-0000", 4.85, "IL Industrial Light Distribution", "Duval County Property Appraiser", "https://www.coj.net/departments/property-appraiser"),
  build("p-9", "Grocery-Anchored Strip Center", "Dallas", "TX", "75248", "Retail", 9850000, 6.65, 54100, 79, "17390 Preston Rd", 32.9868, -96.8041, "Whole Foods Market Anchor", "wholefoodsmarket.com", "0000042-001-010-0000", 4.10, "RR Regional Retail Center", "Dallas Central Appraisal District", "https://www.dallascad.org/"),
  build("p-10", "Transit-Adjacent Mid-Rise Rental", "Brooklyn", "NY", "11217", "Multi-Family", 22400000, 4.6, 91200, 48, "470 Atlantic Ave", 40.6865, -73.9842, "Marcus & Millichap Institutional", "marcusmillichap.com", "3-00185-0012", 1.62, "C6-2A Special Downtown Mixed", "NYC Department of Finance", "https://zola.planning.nyc.gov/"),
  build("p-11", "Cold Storage Flex Facility", "Fresno", "CA", "93725", "Industrial", 5450000, 7.15, 61800, 81, "3410 S Chestnut Ave", 36.7025, -119.7428, "Lineage Logistics Cold Storage", "lineagelogistics.com", "479-020-14", 3.80, "M-2 Heavy Industrial Storage", "Fresno County Assessor", "https://www.co.fresno.ca.us/departments/assessor"),
  build("p-12", "Suburban Dental Retail Pad", "Savannah", "GA", "31405", "Retail", 1480000, 6.95, 5200, 72, "7805 Abercorn St", 31.9965, -81.1278, "Aspen Dental Healthcare", "aspendental.com", "2-0644-01-018", 0.94, "B-C Community Business District", "Chatham County Board of Assessors", "https://boa.chathamcountyga.gov/"),
  build("p-13", "Ocala Premier Apartment Community - 64 Units", "Ocala", "FL", "34471", "Multi-Family", 8900000, 6.4, 52000, 85, "1200 SW 27th Ave", 29.1872, -82.1401, "Lincoln Property Company", "lpc.com", "23412-001-00", 3.65, "B-4 Regional Commercial / Multi", "Marion County Property Appraiser", "https://www.pa.marion.fl.us/"),
  build(
    "p-14",
    "Kroger Shadow-Anchored Neighborhood Shoppes (7 Bays)",
    "Columbus",
    "OH",
    "43229",
    "Retail",
    2350000,
    7.65,
    14800,
    92,
    "5910 Karl Rd",
    40.0894,
    -82.9734,
    "Great Clips, Subway, Physical Therapy, Cleaners",
    "kroger.com",
    "010-184291-00",
    1.65,
    "C-4 Regional Commercial",
    "Franklin County Auditor",
    "https://audr-apps.franklincountyohio.gov/findmyproperty/",
    undefined,
    {
      bays_count: 7,
      anchor_type: "shadow_anchored",
      shadow_anchor_name: "Kroger Marketplace",
      occupancy_pct: 85.7,
      max_tenant_pct: 22.0,
      restaurant_pct: 18.0,
      service_tenant_pct: 75.0,
      roof_type: "TPO",
      roof_age_years: 6,
      roof_rul_years: 14,
      roof_replacement_est: 85000,
      hvac_units_count: 7,
      hvac_avg_age_years: 5,
      hvac_over_12yr_count: 1,
      hvac_replacement_est: 9500,
      parking_stalls: 75,
      parking_ratio: 5.1,
      parking_condition: "Good",
      parking_reseal_est: 14000,
      traffic_vpd: 22400,
      intersection_type: "Signalized Hard Corner",
      radius_3mi_population: 88400,
      radius_3mi_pop_growth_pct: 1.4,
      lease_structure: "NNN",
      walt_years: 4.2,
      in_place_rent_psf: 14.5,
      market_rent_psf: 17.0,
    }
  ),
  build(
    "p-15",
    "Walmart Shadow Strip Center - Keystone Crossing",
    "Indianapolis",
    "IN",
    "46240",
    "Retail",
    3150000,
    7.40,
    18200,
    89,
    "8520 Keystone Crossing",
    39.9112,
    -86.1118,
    "Anytime Fitness, State Farm, UPS Store, Nails",
    "walmart.com",
    "9038291-01",
    1.95,
    "C-3 Neighborhood Commercial",
    "Marion County Assessor",
    "https://www.indy.gov/agency/marion-county-assessor",
    undefined,
    {
      bays_count: 8,
      anchor_type: "shadow_anchored",
      shadow_anchor_name: "Walmart Supercenter",
      occupancy_pct: 100,
      max_tenant_pct: 24.0,
      restaurant_pct: 15.0,
      service_tenant_pct: 85.0,
      roof_type: "Standing Seam Metal",
      roof_age_years: 4,
      roof_rul_years: 26,
      roof_replacement_est: 110000,
      hvac_units_count: 8,
      hvac_avg_age_years: 4,
      hvac_over_12yr_count: 0,
      hvac_replacement_est: 0,
      parking_stalls: 88,
      parking_ratio: 4.8,
      parking_condition: "Excellent",
      parking_reseal_est: 0,
      traffic_vpd: 28500,
      intersection_type: "Signalized T-Intersection",
      radius_3mi_population: 74200,
      radius_3mi_pop_growth_pct: 2.1,
      lease_structure: "NNN",
      walt_years: 4.8,
      in_place_rent_psf: 16.5,
      market_rent_psf: 19.5,
    }
  ),
  build(
    "p-16",
    "Gallatin Pike Unanchored Value-Add Strip (6 Bays)",
    "Nashville",
    "TN",
    "37115",
    "Retail",
    1950000,
    8.20,
    11400,
    94,
    "720 Gallatin Pike N",
    36.2541,
    -86.7188,
    "Metro PCS, Vape Shop, Laundromat, Auto Title",
    "crexi.com",
    "043-03-0-089.00",
    1.15,
    "CS Commercial Services",
    "Davidson County Assessor of Property",
    "https://www.padctn.org/",
    undefined,
    {
      bays_count: 6,
      anchor_type: "unanchored",
      occupancy_pct: 83.3,
      max_tenant_pct: 26.0,
      restaurant_pct: 0,
      service_tenant_pct: 90.0,
      roof_type: "Modified Bitumen",
      roof_age_years: 17,
      roof_rul_years: 3,
      roof_replacement_est: 72000,
      hvac_units_count: 6,
      hvac_avg_age_years: 14,
      hvac_over_12yr_count: 4,
      hvac_replacement_est: 38000,
      parking_stalls: 52,
      parking_ratio: 4.6,
      parking_condition: "Fair (Needs Slurry/Striping)",
      parking_reseal_est: 12000,
      traffic_vpd: 31200,
      intersection_type: "Signalized Corridor Turn Lane",
      radius_3mi_population: 62000,
      radius_3mi_pop_growth_pct: 3.2,
      lease_structure: "Modified Gross",
      walt_years: 2.5,
      in_place_rent_psf: 12.0,
      market_rent_psf: 16.5,
    }
  ),
  build(
    "p-17",
    "Broad Ripple 24-Unit Apartment Community",
    "Indianapolis",
    "IN",
    "46220",
    "Multi-Family",
    2100000,
    6.85,
    19200,
    88,
    "6100 N College Ave",
    39.8654,
    -86.1451,
    "Broad Ripple Courtyard Apartments",
    "apartments.com",
    "9041284-02",
    1.35,
    "D-5 Multi-Family Residential",
    "Marion County Assessor",
    "https://www.indy.gov/agency/marion-county-assessor",
    undefined,
    {
      unit_count: 24,
      price_per_unit: 87500,
      unit_mix_desc: "16x 1BR/1BA, 8x 2BR/1.5BA",
      occupancy_pct: 95.8,
      roof_type: "Pitched Architectural Shingle",
      roof_age_years: 7,
      roof_rul_years: 18,
      roof_replacement_est: 35000,
      hvac_units_count: 24,
      hvac_avg_age_years: 6,
      hvac_over_12yr_count: 2,
      hvac_replacement_est: 12000,
      parking_stalls: 36,
      parking_ratio: 1.5,
      parking_condition: "Good",
      parking_reseal_est: 6000,
    }
  ),
  build(
    "p-18",
    "Highland Park 18-Unit Value-Add Brick Apartments",
    "Columbus",
    "OH",
    "43215",
    "Multi-Family",
    1650000,
    7.10,
    14400,
    91,
    "1450 E Broad St",
    39.9678,
    -82.9612,
    "Highland Garden Apartments",
    "apartments.com",
    "010-098241-00",
    0.95,
    "AR-2 High Density Residential",
    "Franklin County Auditor",
    "https://audr-apps.franklincountyohio.gov/findmyproperty/",
    undefined,
    {
      unit_count: 18,
      price_per_unit: 91666,
      unit_mix_desc: "12x 1BR/1BA, 6x 2BR/1BA",
      occupancy_pct: 94.4,
      roof_type: "EPDM Flat Rubber",
      roof_age_years: 5,
      roof_rul_years: 15,
      roof_replacement_est: 28000,
      hvac_units_count: 18,
      hvac_avg_age_years: 7,
      hvac_over_12yr_count: 3,
      hvac_replacement_est: 18000,
      parking_stalls: 26,
      parking_ratio: 1.4,
      parking_condition: "Fair",
      parking_reseal_est: 7500,
    }
  ),
  build(
    "p-19",
    "Publix Shadow-Anchored Retail Strip (9 Bays)",
    "Tampa",
    "FL",
    "33614",
    "Retail",
    3850000,
    7.15,
    21500,
    87,
    "7802 N Dale Mabry Hwy",
    28.0195,
    -82.5034,
    "Smoothie King, Great Clips, H&R Block, Domino's, Dentist",
    "publix.com",
    "104829-0000",
    2.10,
    "CG Commercial General",
    "Hillsborough County Property Appraiser",
    "https://www.hcpafl.org/",
    undefined,
    {
      bays_count: 9,
      anchor_type: "shadow_anchored",
      shadow_anchor_name: "Publix Super Markets",
      occupancy_pct: 88.9,
      max_tenant_pct: 18.5,
      restaurant_pct: 22.0,
      service_tenant_pct: 78.0,
      roof_type: "TPO Membrane",
      roof_age_years: 8,
      roof_rul_years: 12,
      roof_replacement_est: 125000,
      hvac_units_count: 9,
      hvac_avg_age_years: 6,
      hvac_over_12yr_count: 1,
      hvac_replacement_est: 9500,
      parking_stalls: 110,
      parking_ratio: 5.1,
      parking_condition: "Good",
      parking_reseal_est: 18000,
      traffic_vpd: 34000,
      intersection_type: "Signalized Full Access",
      radius_3mi_population: 112000,
      radius_3mi_pop_growth_pct: 1.8,
      lease_structure: "NNN",
      walt_years: 3.8,
      in_place_rent_psf: 21.0,
      market_rent_psf: 24.5,
    }
  ),
];

export const FIXTURE_SUMMARY: MarketSummary = {
  total_inventory_value: 42800000,
  inventory_trend_pct: 4.2,
  avg_cap_rate: 6.85,
  cap_rate_distribution: [3, 7, 12, 22, 31, 24, 16, 9, 5, 2],
  median_price_per_sqft: 245,
  regional_benchmark_price_per_sqft: 268,
  undervalued_count: 14,
  inventory_trend_series: [31, 33, 32, 35, 37, 36, 38, 40, 39, 41, 42, 42.8],
};

export const FIXTURE_HUBS: MarketHub[] = [
  {
    id: "h-1",
    name: "Austin Retail Corridor",
    city: "Austin",
    state: "TX",
    pagerank: 0.184,
    connections: 342,
    avg_cap_rate: 6.9,
    neighbors: [
      { name: "Round Rock NNN Belt", weight: 0.82, hop: 1 },
      { name: "Cedar Park Pad Sites", weight: 0.71, hop: 1 },
      { name: "San Marcos Outlet Node", weight: 0.55, hop: 2 },
      { name: "New Braunfels Retail", weight: 0.41, hop: 2 },
      { name: "San Antonio 281 Spine", weight: 0.33, hop: 3 },
    ],
  },
  {
    id: "h-2",
    name: "Brickell Medical Hub",
    city: "Miami",
    state: "FL",
    pagerank: 0.161,
    connections: 298,
    avg_cap_rate: 5.8,
    neighbors: [
      { name: "Coral Gables Office", weight: 0.78, hop: 1 },
      { name: "Doral Medical Flex", weight: 0.64, hop: 1 },
      { name: "Aventura Care Cluster", weight: 0.47, hop: 2 },
      { name: "Fort Lauderdale CBD", weight: 0.38, hop: 3 },
    ],
  },
  {
    id: "h-3",
    name: "Houston Logistics Triangle",
    city: "Houston",
    state: "TX",
    pagerank: 0.147,
    connections: 276,
    avg_cap_rate: 7.4,
    neighbors: [
      { name: "Katy Freeway Industrial", weight: 0.86, hop: 1 },
      { name: "Port of Houston Yard", weight: 0.73, hop: 1 },
      { name: "Baytown Cold Chain", weight: 0.51, hop: 2 },
      { name: "Beaumont Transload", weight: 0.29, hop: 3 },
    ],
  },
  {
    id: "h-4",
    name: "Atlanta Westside Multi-Family",
    city: "Atlanta",
    state: "GA",
    pagerank: 0.129,
    connections: 241,
    avg_cap_rate: 6.15,
    neighbors: [
      { name: "Midtown Rental Core", weight: 0.75, hop: 1 },
      { name: "Chamblee Value-Add", weight: 0.58, hop: 1 },
      { name: "Marietta Garden Belt", weight: 0.44, hop: 2 },
    ],
  },
  {
    id: "h-5",
    name: "DTLA Creative Office Cluster",
    city: "Los Angeles",
    state: "CA",
    pagerank: 0.108,
    connections: 205,
    avg_cap_rate: 5.25,
    neighbors: [
      { name: "Arts District Lofts", weight: 0.69, hop: 1 },
      { name: "Culver Media Node", weight: 0.52, hop: 2 },
      { name: "Pasadena Office", weight: 0.35, hop: 3 },
    ],
  },
  {
    id: "h-6",
    name: "Brooklyn Transit Rental Ring",
    city: "Brooklyn",
    state: "NY",
    pagerank: 0.094,
    connections: 188,
    avg_cap_rate: 4.65,
    neighbors: [
      { name: "Downtown BK Towers", weight: 0.72, hop: 1 },
      { name: "Bushwick Conversions", weight: 0.49, hop: 2 },
      { name: "Jersey City Waterfront", weight: 0.31, hop: 3 },
    ],
  },
];

/** Local heuristic used when the ML backend is unreachable. */
export function fixturePrediction(input: PredictionInput): PredictionResult {
  const typeBase: Record<string, number> = {
    Retail: 205,
    Industrial: 118,
    Office: 262,
    "Multi-Family": 178,
    Land: 22,
  };
  const stateMult: Record<string, number> = { TX: 1, FL: 1.08, CA: 1.42, GA: 0.95, NY: 1.66 };
  const base = typeBase[input.property_type] ?? 190;
  const capAdj = 6.75 / Math.max(input.cap_rate || 6.75, 3.5);
  const ppsf = base * (stateMult[input.state] ?? 1) * capAdj;
  const predicted = Math.max(ppsf * Math.max(input.sqft, 1), 50000);
  const undervaluation = input.listed_price > 0 ? ((predicted - input.listed_price) / predicted) * 100 : 0;
  const score = Math.max(1, Math.min(99, Math.round(50 + undervaluation * 2.2)));
  const recommendation =
    score >= 80
      ? `Strong buy signal. The model places fair value roughly ${Math.abs(undervaluation).toFixed(1)}% above the asking price, driven by ${input.property_type.toLowerCase()} comps in ${input.city}, ${input.state} and a cap rate above submarket median.`
      : score >= 60
        ? `Constructive. Pricing sits modestly below modeled value; underwrite tenant credit and rollover risk before committing capital.`
        : score >= 45
          ? `Fairly priced. Returns depend on operational upside rather than an entry discount — model fair value is within noise of the ask.`
          : `Caution. The ask exceeds modeled fair value for this ${input.property_type.toLowerCase()} profile; re-trade or pass unless NOI growth is contractual.`;

  return {
    predicted_price: Math.round(predicted),
    predicted_price_per_sqft: Number(ppsf.toFixed(2)),
    confidence: Math.round(84 + (score % 9)),
    deal_score: score,
    undervaluation_pct: Number(undervaluation.toFixed(1)),
    recommendation,
  };
}

export function filterFixtures(params: Record<string, string>): Listing[] {
  const q = (params["q"] ?? "").toLowerCase();
  const type = params["property_type"] ?? "";
  const state = params["state"] ?? "";
  const city = (params["city"] ?? "").toLowerCase();
  const nums = (k: string, d: number) => {
    const v = Number(params[k]);
    return Number.isFinite(v) ? v : d;
  };

  return FIXTURE_LISTINGS.filter((l) => {
    if (type && type !== "All" && l.property_type !== type) return false;
    if (state && l.state !== state) return false;
    if (city && !l.city.toLowerCase().includes(city)) return false;
    if (l.listing_price < nums("min_price", 0) || l.listing_price > nums("max_price", Infinity)) return false;
    if (l.cap_rate < nums("min_cap_rate", 0) || l.cap_rate > nums("max_cap_rate", Infinity)) return false;
    if (l.sqft < nums("min_sqft", 0) || l.sqft > nums("max_sqft", Infinity)) return false;
    if (q) {
      const hay = `${l.title} ${l.address} ${l.city} ${l.state} ${l.zip} ${l.property_type} ${l.description ?? ""}`.toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      if (words.length && !words.every((w) => hay.includes(w))) return false;
    }
    return true;
  }).sort((a, b) => b.deal_score - a.deal_score);
}
