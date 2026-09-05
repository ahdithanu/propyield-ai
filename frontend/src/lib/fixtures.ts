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

const INDIVIDUAL_IMAGES: Record<string, string> = {
  "p-1": "https://images.unsplash.com/photo-1555636222-cae831e670b3?q=80&w=1200&auto=format&fit=crop",
  "p-2": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
  "p-3": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
  "p-4": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop",
  "p-5": "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=1200&auto=format&fit=crop",
  "p-6": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
  "p-7": "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop",
  "p-8": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1200&auto=format&fit=crop",
  "p-9": "https://images.unsplash.com/photo-1567449303078-57ad995bd301?q=80&w=1200&auto=format&fit=crop",
  "p-10": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop",
  "p-11": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop",
  "p-12": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
  "p-13": "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop",
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
  customImage?: string
): Listing {
  const undervaluation = (score - 50) * 0.4;
  const predicted = Math.round(price * (1 + undervaluation / 100));
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
    image_url: customImage ?? INDIVIDUAL_IMAGES[id] ?? TYPE_IMAGE[type] ?? retail,
    year_built: 1998 + (Number(id.replace(/\D/g, "")) % 25),
    noi: Math.round((price * cap) / 100),
    description:
      "Institutional-quality asset in a high-velocity submarket with durable tenancy and below-replacement-cost basis.",
    external_url: `https://www.crexi.com/properties?search=${encodeURIComponent(title)}`,
  };
}

export const FIXTURE_LISTINGS: Listing[] = [
  build("p-1", "Prime NNN Retail Center - Highway 183", "Austin", "TX", "78753", "Retail", 2750000, 6.85, 14200, 84, "8214 Research Blvd"),
  build("p-2", "Class A Distribution Warehouse - Grand Pkwy", "Houston", "TX", "77433", "Industrial", 8450000, 7.4, 96500, 91, "21400 Clay Rd"),
  build("p-3", "Brickell Medical Office Condo", "Miami", "FL", "33131", "Office", 4120000, 5.9, 18300, 62, "1450 Brickell Ave"),
  build("p-4", "Sunbelt Garden Apartments - 84 Units", "Atlanta", "GA", "30318", "Multi-Family", 12600000, 6.1, 78400, 76, "1201 Marietta St NW"),
  build("p-5", "Single-Tenant Auto Service - I-35 Frontage", "San Antonio", "TX", "78216", "Retail", 1950000, 7.85, 8600, 88, "9950 San Pedro Ave"),
  build("p-6", "Infill Development Land - 4.2 Acres", "Tampa", "FL", "33607", "Land", 3200000, 4.2, 182000, 54, "4300 W Cypress St"),
  build("p-7", "Creative Loft Office Campus", "Los Angeles", "CA", "90013", "Office", 15750000, 5.2, 62800, 41, "820 E 3rd St"),
  build("p-8", "Last-Mile Logistics Hub", "Jacksonville", "FL", "32218", "Industrial", 6300000, 7.95, 74200, 93, "1155 Busch Dr"),
  build("p-9", "Grocery-Anchored Strip Center", "Dallas", "TX", "75248", "Retail", 9850000, 6.65, 54100, 79, "17390 Preston Rd"),
  build("p-10", "Transit-Adjacent Mid-Rise Rental", "Brooklyn", "NY", "11217", "Multi-Family", 22400000, 4.6, 91200, 48, "470 Atlantic Ave"),
  build("p-11", "Cold Storage Flex Facility", "Fresno", "CA", "93725", "Industrial", 5450000, 7.15, 61800, 81, "3410 S Chestnut Ave"),
  build("p-12", "Suburban Dental Retail Pad", "Savannah", "GA", "31405", "Retail", 1480000, 6.95, 5200, 72, "7805 Abercorn St"),
  build("p-13", "Ocala Premier Apartment Community - 64 Units", "Ocala", "FL", "34471", "Multi-Family", 8900000, 6.4, 52000, 85, "1200 SW 27th Ave"),
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
      const hay = `${l.title} ${l.city} ${l.state} ${l.property_type} ${l.description ?? ""}`.toLowerCase();
      const words = q.split(/\s+/).filter((w) => w.length > 3);
      if (words.length && !words.some((w) => hay.includes(w))) return false;
    }
    return true;
  }).sort((a, b) => b.deal_score - a.deal_score);
}
