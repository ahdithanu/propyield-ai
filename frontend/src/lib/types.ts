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
  description?: string | null;
  year_built?: number | null;
  noi?: number | null;
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
