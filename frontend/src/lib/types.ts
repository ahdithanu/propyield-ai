export const PROPERTY_TYPES = [
  "All",
  "Retail",
  "Industrial",
  "Office",
  "Multi-Family",
  "Land",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const STATES = ["TX", "FL", "CA", "GA", "NY"] as const;

export interface Listing {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: string;
  listing_price: number;
  cap_rate: number;
  sqft: number;
  price_per_sqft: number;
  deal_score: number;
  ml_predicted_price: number;
  undervaluation_pct: number;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  tenant_domain?: string | null;
  tenant_name?: string | null;
  parcel_id?: string | null;
  lot_size_acres?: number | null;
  lot_size_sqft?: number | null;
  zoning_code?: string | null;
  county?: string | null;
  parcel_boundary?: [number, number][] | null;
  county_gis_url?: string | null;
  
  // Buy Box & Bay Architecture
  bays_count?: number | null;
  anchor_type?: "Unanchored" | "Shadow-Anchored" | "Grocery-Anchored" | "Single-Tenant" | null;
  shadow_anchor_name?: string | null;
  occupancy_pct?: number | null;
  max_tenant_pct?: number | null;
  restaurant_pct?: number | null;
  service_tenant_pct?: number | null;
  
  // Big 3 Capex & Useful Life Ledger
  roof_type?: string | null;
  roof_age_years?: number | null;
  roof_rul_years?: number | null;
  roof_replacement_est?: number | null;
  hvac_units_count?: number | null;
  hvac_avg_age_years?: number | null;
  hvac_over_12yr_count?: number | null;
  hvac_replacement_est?: number | null;
  parking_stalls?: number | null;
  parking_ratio?: number | null;
  parking_condition?: string | null;
  parking_reseal_est?: number | null;
  
  // Micro-Location & Traffic
  traffic_vpd?: number | null;
  intersection_type?: string | null;
  radius_3mi_population?: number | null;
  radius_3mi_pop_growth_pct?: number | null;
  
  // Lease Structure & WALT
  lease_structure?: "NNN" | "Modified NNN" | "Gross" | null;
  walt_years?: number | null;
  in_place_rent_psf?: number | null;
  market_rent_psf?: number | null;
  
  // Multifamily Buy Box (16-32 Units)
  unit_count?: number | null;
  price_per_unit?: number | null;
  unit_mix_desc?: string | null;
  
  description?: string | null;
  year_built?: number | null;
  noi?: number | null;
  external_url?: string | null;
}

export interface MarketSummary {
  total_inventory_value: number;
  inventory_trend_pct: number;
  avg_cap_rate: number;
  cap_rate_distribution: number[];
  median_price_per_sqft: number;
  regional_benchmark_price_per_sqft: number;
  undervalued_count: number;
  inventory_trend_series: number[];
}

export interface PredictionResult {
  predicted_price: number;
  predicted_price_per_sqft: number;
  confidence: number;
  deal_score: number;
  undervaluation_pct: number;
  recommendation: string;
}

export interface PredictionInput {
  property_type: string;
  sqft: number;
  city: string;
  state: string;
  cap_rate: number;
  listed_price: number;
}

export interface MarketHubNeighbor {
  name: string;
  weight: number;
  hop: number;
}

export interface MarketHub {
  id: string;
  name: string;
  city: string;
  state: string;
  pagerank: number;
  connections: number;
  avg_cap_rate: number;
  neighbors: MarketHubNeighbor[];
}

export interface ListingQuery {
  q: string;
  type: string;
  state: string;
  city: string;
  minPrice: number;
  maxPrice: number;
  minCap: number;
  maxCap: number;
  minSqft: number;
  maxSqft: number;
}
