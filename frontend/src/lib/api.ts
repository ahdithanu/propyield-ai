import { queryOptions } from "@tanstack/react-query";

import {
  FIXTURE_HUBS,
  FIXTURE_SUMMARY,
  filterFixtures,
  fixturePrediction,
} from "./fixtures";
import type {
  Listing,
  ListingQuery,
  MarketHub,
  MarketSummary,
  PredictionInput,
  PredictionResult,
} from "./types";

export const API_BASE =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "https://propyield-backend.onrender.com/api/v1";

export interface ApiResult<T> {
  data: T;
  /** True when the FastAPI backend could not be reached and demo data is shown. */
  offline: boolean;
}

const TIMEOUT_MS = 20000;

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("propyield_access_token");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("propyield_access_token", token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("propyield_access_token");
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

const n = (v: unknown, d = 0) => {
  const x = typeof v === "string" ? Number(v) : v;
  return typeof x === "number" && Number.isFinite(x) ? x : d;
};
const s = (v: unknown, d = "") => (typeof v === "string" && v.length ? v : d);

/** Tolerant normalizer: maps all 28 core + Buy Box & Big 3 CapEx fields from backend payload. */
function toListing(raw: Record<string, unknown>, i: number): Listing {
  const type = s(raw["property_type"] ?? raw["type"] ?? raw["asset_type"], "Retail");
  const price = n(raw["listing_price"] ?? raw["price"] ?? raw["list_price"]);
  const sqft = n(raw["sqft"] ?? raw["square_feet"] ?? raw["building_sqft"], 1);
  const predicted = n(raw["ml_predicted_price"] ?? raw["predicted_price"] ?? raw["fair_market_value"], price);
  const under = raw["undervaluation_pct"];
  const optNum = (key: string): number | null =>
    raw[key] !== undefined && raw[key] !== null ? n(raw[key]) : null;
  const optStr = (key: string): string | null =>
    raw[key] !== undefined && raw[key] !== null && String(raw[key]).length > 0 ? String(raw[key]) : null;

  return {
    id: s(raw["id"] ?? raw["external_id"] ?? raw["listing_id"] ?? raw["_id"], `listing-${i}`),
    title: s(raw["title"] ?? raw["name"], "Commercial Property"),
    address: s(raw["address"] ?? raw["street_address"]),
    city: s(raw["city"]),
    state: s(raw["state"]),
    zip: s(raw["zip"] ?? raw["zip_code"] ?? raw["postal_code"]),
    property_type: type,
    listing_price: price,
    cap_rate: n(raw["cap_rate"] ?? raw["caprate"]),
    sqft,
    price_per_sqft: n(raw["price_per_sqft"] ?? raw["price_psf"], sqft ? Math.round((price / sqft) * 100) / 100 : 0),
    deal_score: n(raw["deal_score"] ?? raw["undervaluation_score"] ?? raw["score"]),
    ml_predicted_price: predicted,
    undervaluation_pct:
      under !== undefined
        ? n(under)
        : predicted > 0
          ? Number((((predicted - price) / predicted) * 100).toFixed(1))
          : 0,
    image_url: raw["image_url"] ? s(raw["image_url"]) : null,
    latitude: optNum("latitude"),
    longitude: optNum("longitude"),
    tenant_domain: s(raw["tenant_domain"] ?? raw["domain"]) || null,
    tenant_name: optStr("tenant_name"),
    parcel_id: s(raw["parcel_id"] ?? raw["apn"]) || null,
    lot_size_acres: optNum("lot_size_acres"),
    lot_size_sqft: optNum("lot_size_sqft"),
    zoning_code: s(raw["zoning_code"] ?? raw["zoning"]) || null,
    county: s(raw["county"] ?? raw["county_name"]) || null,
    county_gis_url: s(raw["county_gis_url"] ?? raw["gis_url"]) || null,
    bays_count: optNum("bays_count"),
    anchor_type: optStr("anchor_type"),
    shadow_anchor_name: optStr("shadow_anchor_name"),
    occupancy_pct: optNum("occupancy_pct"),
    max_tenant_pct: optNum("max_tenant_pct"),
    restaurant_pct: optNum("restaurant_pct"),
    service_tenant_pct: optNum("service_tenant_pct"),
    roof_type: optStr("roof_type"),
    roof_age_years: optNum("roof_age_years"),
    roof_rul_years: optNum("roof_rul_years"),
    roof_replacement_est: optNum("roof_replacement_est"),
    hvac_units_count: optNum("hvac_units_count"),
    hvac_avg_age_years: optNum("hvac_avg_age_years"),
    hvac_over_12yr_count: optNum("hvac_over_12yr_count"),
    hvac_replacement_est: optNum("hvac_replacement_est"),
    parking_stalls: optNum("parking_stalls"),
    parking_ratio: optNum("parking_ratio"),
    parking_condition: optStr("parking_condition"),
    parking_reseal_est: optNum("parking_reseal_est"),
    traffic_vpd: optNum("traffic_vpd"),
    intersection_type: optStr("intersection_type"),
    lease_structure: optStr("lease_structure"),
    walt_years: optNum("walt_years"),
    unit_count: optNum("unit_count"),
    price_per_unit: optNum("price_per_unit"),
    description: optStr("description"),
    year_built: optNum("year_built"),
    noi: optNum("noi"),
    external_url: s(
      raw["external_url"] ?? raw["url"] ?? raw["source_url"] ?? raw["crexi_url"],
      `https://www.crexi.com/properties`,
    ),
  };
}

function unwrapArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    for (const key of ["results", "items", "listings", "data", "hubs"]) {
      const v = (payload as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
  }
  return [];
}

export function listingParams(q: ListingQuery): Record<string, string> {
  return {
    q: q.q,
    property_type: q.type,
    state: q.state,
    city: q.city,
    min_price: String(q.minPrice),
    max_price: String(q.maxPrice),
    min_cap_rate: String(q.minCap),
    max_cap_rate: String(q.maxCap),
    min_sqft: String(q.minSqft),
    max_sqft: String(q.maxSqft),
  };
}

export async function fetchListings(q: ListingQuery): Promise<ApiResult<Listing[]>> {
  const params = listingParams(q);
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "" && v !== "All"),
  );
  try {
    if (q.q.trim()) {
      const payload = await call<unknown>("/ml/semantic-search", {
        method: "POST",
        body: JSON.stringify({ query: q.q, filters: params, limit: 24 }),
      });
      const rows = unwrapArray(payload).map(toListing);
      if (rows.length) return { data: rows, offline: false };
    }
    const payload = await call<unknown>(`/listings?${search.toString()}`);
    return { data: unwrapArray(payload).map(toListing), offline: false };
  } catch {
    return { data: filterFixtures(params), offline: true };
  }
}

export async function fetchMarketSummary(): Promise<ApiResult<MarketSummary>> {
  try {
    const raw = (await call<Record<string, unknown>>("/analytics/market-summary")) ?? {};
    const data: MarketSummary = {
      total_inventory_value: n(raw["total_inventory_value"] ?? raw["total_market_inventory"], FIXTURE_SUMMARY.total_inventory_value),
      inventory_trend_pct: n(raw["inventory_trend_pct"] ?? raw["trend_pct"], FIXTURE_SUMMARY.inventory_trend_pct),
      avg_cap_rate: n(raw["avg_cap_rate"] ?? raw["average_cap_rate"], FIXTURE_SUMMARY.avg_cap_rate),
      cap_rate_distribution: Array.isArray(raw["cap_rate_distribution"])
        ? (raw["cap_rate_distribution"] as number[])
        : FIXTURE_SUMMARY.cap_rate_distribution,
      median_price_per_sqft: n(raw["median_price_per_sqft"], FIXTURE_SUMMARY.median_price_per_sqft),
      regional_benchmark_price_per_sqft: n(
        raw["regional_benchmark_price_per_sqft"] ?? raw["benchmark_price_per_sqft"],
        FIXTURE_SUMMARY.regional_benchmark_price_per_sqft,
      ),
      undervalued_count: n(raw["undervalued_count"] ?? raw["undervalued_opportunities"], FIXTURE_SUMMARY.undervalued_count),
      inventory_trend_series: Array.isArray(raw["inventory_trend_series"])
        ? (raw["inventory_trend_series"] as number[])
        : FIXTURE_SUMMARY.inventory_trend_series,
    };
    return { data, offline: false };
  } catch {
    return { data: FIXTURE_SUMMARY, offline: true };
  }
}

export async function fetchMarketHubs(): Promise<ApiResult<MarketHub[]>> {
  try {
    const payload = await call<unknown>("/graph/market-hubs");
    const rows = unwrapArray(payload).map((raw, i): MarketHub => {
      const neighbors = Array.isArray(raw["neighbors"]) ? (raw["neighbors"] as Record<string, unknown>[]) : [];
      return {
        id: s(raw["id"] ?? raw["hub_id"], `hub-${i}`),
        name: s(raw["name"] ?? raw["hub_name"], `Hub ${i + 1}`),
        city: s(raw["city"]),
        state: s(raw["state"]),
        pagerank: n(raw["pagerank"] ?? raw["pagerank_score"] ?? raw["centrality"]),
        connections: n(raw["connections"] ?? raw["node_connections"] ?? raw["degree"]),
        avg_cap_rate: n(raw["avg_cap_rate"]),
        neighbors: neighbors.map((nb) => ({
          name: s(nb["name"] ?? nb["node"], "Node"),
          weight: n(nb["weight"] ?? nb["score"], 0.5),
          hop: n(nb["hop"] ?? nb["hops"], 1),
        })),
      };
    });
    if (!rows.length) throw new Error("empty");
    return { data: rows, offline: false };
  } catch {
    return { data: FIXTURE_HUBS, offline: true };
  }
}

export async function predictPrice(input: PredictionInput): Promise<ApiResult<PredictionResult>> {
  try {
    const raw = await call<Record<string, unknown>>("/ml/predict-price", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const predicted = n(raw["predicted_price"] ?? raw["fair_market_price"] ?? raw["prediction"]);
    if (!predicted) throw new Error("no prediction");
    const ppsf = n(raw["predicted_price_per_sqft"] ?? raw["price_per_sqft"], input.sqft ? predicted / input.sqft : 0);
    const confidenceRaw = n(raw["confidence"] ?? raw["confidence_score"], 0.9);
    return {
      data: {
        predicted_price: predicted,
        predicted_price_per_sqft: Number(ppsf.toFixed(2)),
        confidence: confidenceRaw <= 1 ? Math.round(confidenceRaw * 100) : Math.round(confidenceRaw),
        deal_score: n(raw["deal_score"] ?? raw["undervaluation_score"]),
        undervaluation_pct: n(
          raw["undervaluation_pct"],
          predicted ? Number((((predicted - input.listed_price) / predicted) * 100).toFixed(1)) : 0,
        ),
        recommendation: s(raw["recommendation"] ?? raw["investment_recommendation"], "—"),
      },
      offline: false,
    };
  } catch {
    return { data: fixturePrediction(input), offline: true };
  }
}

export const marketSummaryQuery = () =>
  queryOptions({ queryKey: ["market-summary"], queryFn: fetchMarketSummary, staleTime: 60_000 });

export const marketHubsQuery = () =>
  queryOptions({ queryKey: ["market-hubs"], queryFn: fetchMarketHubs, staleTime: 60_000 });

export const listingsQuery = (q: ListingQuery) =>
  queryOptions({
    queryKey: ["listings", q],
    queryFn: () => fetchListings(q),
    retry: 1,
    staleTime: 30_000,
  });

export interface UnderwriteActionInput {
  address: string;
  asking_price: number;
  sqft: number;
  bays_count: number;
  roof_age_years?: number;
  hvac_over_12yr_count?: number;
  parking_reseal_est?: number;
  occupancy_pct?: number;
}

export interface UnderwriteActionOutput {
  buy_box_verdict: "PASS" | "CAUTION" | "FAIL" | string;
  loi_strike_price: number;
  total_capex_deductions: number;
  cadastral_apn: string;
  breakdown?: Record<string, unknown>;
}

export async function underwriteDealAction(input: UnderwriteActionInput): Promise<UnderwriteActionOutput | null> {
  try {
    return await call<UnderwriteActionOutput>("/pipeline/underwrite-action", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch {
    return null;
  }
}

export interface AgentCopilotResponse {
  trace_id: string;
  verdict: string;
  intent: string;
  confidence: number;
  authorized_tools: string[];
  tool_calls: Record<string, unknown>[];
  citations: { chunk_id?: string; document_name?: string; rerank_score?: number; snippet?: string }[];
  response: string;
  latency_ms: number;
}

export async function askAgentCopilot(prompt: string, context?: Record<string, unknown>): Promise<AgentCopilotResponse | null> {
  try {
    return await call<AgentCopilotResponse>("/agent/chat", {
      method: "POST",
      body: JSON.stringify({ prompt, context: context ?? {} }),
    });
  } catch {
    return null;
  }
}
