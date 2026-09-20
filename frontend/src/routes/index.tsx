import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Compass, Download, LayoutGrid, Rows3, Sparkles, MapPin, Store, Building } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DEFAULT_DRAFT, FilterBar, type FilterDraft } from "@/components/filter-bar";
import { KpiCards } from "@/components/kpi-cards";
import { PropertyCard } from "@/components/property-card";
import { PropertyTable } from "@/components/property-table";
import { SiteHeader } from "@/components/site-header";
import { DemoTourModal } from "@/components/demo-tour";
import { IcMemoModal } from "@/components/ic-memo-modal";
import { UnderwriteDealModal } from "@/components/underwrite-deal-modal";
import { ValuationDrawer } from "@/components/valuation-drawer";
import { formFromListing, type ValuationForm } from "@/components/valuation-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listingsQuery, marketSummaryQuery } from "@/lib/api";
import { downloadCsv, toCsv } from "@/lib/csv";
import { money } from "@/lib/format";
import type { Listing, ListingQuery } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DashboardSearch {
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
  view: string;
}

const str = (v: unknown, d: string) => (typeof v === "string" && v.length ? v : d);
const nb = (v: unknown, d: number) => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : d;
};

export const Route = createFileRoute("/")({
  validateSearch: (
    search: Partial<Record<keyof DashboardSearch, unknown>>,
  ): Partial<DashboardSearch> => {
    const out: Partial<DashboardSearch> = {};
    if (search["q"] !== undefined) out.q = str(search["q"], "");
    if (search["type"] !== undefined) out.type = str(search["type"], "All");
    if (search["state"] !== undefined) out.state = str(search["state"], "ALL");
    if (search["city"] !== undefined) out.city = str(search["city"], "");
    if (search["minPrice"] !== undefined) out.minPrice = nb(search["minPrice"], 500_000);
    if (search["maxPrice"] !== undefined) out.maxPrice = nb(search["maxPrice"], 25_000_000);
    if (search["minCap"] !== undefined) out.minCap = nb(search["minCap"], 4);
    if (search["maxCap"] !== undefined) out.maxCap = nb(search["maxCap"], 12);
    if (search["minSqft"] !== undefined) out.minSqft = nb(search["minSqft"], 0);
    if (search["maxSqft"] !== undefined) out.maxSqft = nb(search["maxSqft"], 0);
    if (search["view"] !== undefined) out.view = str(search["view"], "grid");
    return out;
  },
  head: () => ({
    meta: [
      { title: "PropYield AI — CRE Deal Intelligence Dashboard" },
      {
        name: "description",
        content:
          "Screen commercial real estate deals with ML valuation, cap rate analytics, and AI vector search across retail, industrial, office, and multi-family assets.",
      },
      { property: "og:title", content: "PropYield AI — CRE Deal Intelligence Dashboard" },
      {
        property: "og:description",
        content:
          "ML-scored commercial real estate opportunities, live cap rate analytics, and natural-language property search.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const raw = Route.useSearch();
  const search: DashboardSearch = {
    q: raw.q ?? "",
    type: raw.type ?? "All",
    state: raw.state ?? "ALL",
    city: raw.city ?? "",
    minPrice: raw.minPrice ?? 500_000,
    maxPrice: raw.maxPrice ?? 25_000_000,
    minCap: raw.minCap ?? 4,
    maxCap: raw.maxCap ?? 12,
    minSqft: raw.minSqft ?? 0,
    maxSqft: raw.maxSqft ?? 0,
    view: raw.view ?? "grid",
  };
  const navigate = useNavigate({ from: Route.fullPath });

  const [draft, setDraft] = useState<FilterDraft>({
    state: search.state,
    city: search.city,
    priceRange: [search.minPrice, search.maxPrice],
    capRange: [search.minCap, search.maxCap],
    minSqft: search.minSqft ? String(search.minSqft) : "",
    maxSqft: search.maxSqft ? String(search.maxSqft) : "",
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerForm, setDrawerForm] = useState<ValuationForm | undefined>(undefined);
  const [demoTourOpen, setDemoTourOpen] = useState(false);
  const [underwriteOpen, setUnderwriteOpen] = useState(false);
  const [icMemoListing, setIcMemoListing] = useState<Listing | null>(null);

  const query: ListingQuery = useMemo(
    () => ({
      q: search.q,
      type: search.type,
      state: search.state === "ALL" ? "" : search.state,
      city: search.city,
      minPrice: search.minPrice,
      maxPrice: search.maxPrice,
      minCap: search.minCap,
      maxCap: search.maxCap,
      minSqft: search.minSqft,
      maxSqft: search.maxSqft || 1_000_000,
    }),
    [raw],
  );

  const summary = useQuery(marketSummaryQuery());
  const listings = useQuery(listingsQuery(query));

  const offline = Boolean(summary.data?.offline || listings.data?.offline);

  // Custom user-underwritten deals from localStorage
  const [customDeals, setCustomDeals] = useState<Listing[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("propyield_custom_deals");
      if (stored) {
        setCustomDeals(JSON.parse(stored) as Listing[]);
      }
    } catch {
      // ignore
    }
  }, [underwriteOpen]);

  const rows = useMemo(() => {
    const apiRows = listings.data?.data ?? [];
    if (!customDeals.length) return apiRows;

    // Filter custom deals by current query criteria
    const filteredCustom = customDeals.filter((d) => {
      if (search.type !== "All" && d.property_type !== search.type) return false;
      if (search.state !== "ALL" && d.state !== search.state) return false;
      if (search.minPrice && d.listing_price < search.minPrice) return false;
      if (search.maxPrice && d.listing_price > search.maxPrice) return false;
      if (search.minCap && d.cap_rate < search.minCap) return false;
      if (search.maxCap && d.cap_rate > search.maxCap) return false;
      return true;
    });

    // Avoid duplicate IDs
    const existingIds = new Set(apiRows.map((r) => String(r.id)));
    const uniqueCustom = filteredCustom.filter((c) => !existingIds.has(String(c.id)));
    return [...uniqueCustom, ...apiRows];
  }, [listings.data?.data, customDeals, search]);

  useEffect(() => {
    if (search.q && listings.data && !listings.isFetching) {
      toast.success(`Vector search returned ${listings.data.data.length} matches for "${search.q}"`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings.data]);

  const applyFilters = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        state: draft.state,
        city: draft.city,
        minPrice: draft.priceRange[0],
        maxPrice: draft.priceRange[1],
        minCap: draft.capRange[0],
        maxCap: draft.capRange[1],
        minSqft: Number(draft.minSqft) || 0,
        maxSqft: Number(draft.maxSqft) || 0,
      }),
    });
  };

  const resetFilters = () => {
    setDraft(DEFAULT_DRAFT);
    navigate({
      search: {
        q: "",
        type: "All",
        state: "ALL",
        city: "",
        minPrice: 500_000,
        maxPrice: 25_000_000,
        minCap: 4,
        maxCap: 12,
        minSqft: 0,
        maxSqft: 0,
        view: search.view,
      },
    });
    toast.info("Filters reset");
  };

  const analyze = (listing: Listing) => {
    setDrawerForm(formFromListing(listing));
    setDrawerOpen(true);
  };

  const handleStepAction = (stepIndex: number) => {
    if (stepIndex === 0) {
      // Step 1: AI Vector Search
      navigate({ search: (prev) => ({ ...prev, q: "high cap rate retail near highway" }) });
    } else if (stepIndex === 1 && rows.length) {
      // Step 2: ML Valuation & Arbitrage
      const topDeal = rows.reduce((best, cur) => (cur.deal_score > best.deal_score ? cur : best), rows[0]!);
      analyze(topDeal);
    } else if (stepIndex === 2) {
      // Step 3: Graph Topology
      navigate({ to: "/market-hubs" });
    } else if (stepIndex === 3 && rows.length) {
      // Step 4: Scenario Underwriting Sandbox
      analyze(rows[0]!);
    } else if (stepIndex === 4 && rows.length) {
      // Step 5: Partner IC Memo
      setIcMemoListing(rows[0]!);
    }
  };

  const exportCsv = () => {
    if (!rows.length) {
      toast.error("Nothing to export yet");
      return;
    }
    const csv = toCsv(
      rows as unknown as Record<string, unknown>[],
      [
        "id",
        "title",
        "address",
        "city",
        "state",
        "property_type",
        "listing_price",
        "cap_rate",
        "sqft",
        "price_per_sqft",
        "deal_score",
        "ml_predicted_price",
        "undervaluation_pct",
      ],
    );
    downloadCsv(`propyield-listings-${Date.now()}.csv`, csv);
    toast.success(`Exported ${rows.length} listings to CSV`);
  };

  const setView = (view: "grid" | "table") =>
    navigate({ search: (prev) => ({ ...prev, view }) });

  return (
    <div className="min-h-screen bg-background pb-12">
      <SiteHeader onOpenDemo={() => setDemoTourOpen(true)} />

      <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        {offline ? (
          <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
            <p className="text-foreground/90">
              <span className="font-semibold text-warn">Live Backend Status:</span> Connected via fallback demo pipeline.
              Set <code className="num text-xs">VITE_API_BASE_URL</code> to your deployed Render API URL for 24/7 live sync.
            </p>
          </div>
        ) : null}

        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Commercial Deal Intelligence</h1>
            <p className="text-sm text-muted-foreground">
              ML-scored valuation, vector search, and graph centrality across the live CRE pipeline.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => setUnderwriteOpen(true)}
              className="gap-2 bg-emerald font-semibold text-background hover:bg-emerald/90 shadow-sm"
            >
              <Sparkles className="size-4" /> Underwrite Any Deal
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDemoTourOpen(true)}
              className="gap-2 border border-emerald/40 bg-emerald-soft/40 text-emerald hover:bg-emerald-soft font-semibold"
            >
              <Compass className="size-4" /> Partner Walkthrough
            </Button>
          </div>
        </section>

        {/* 1-Click Buy Box Screeners */}
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border/80 bg-surface/50 p-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
            Institutional Buy Box Presets:
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-emerald/40 bg-emerald-soft/20 text-xs font-semibold text-emerald hover:bg-emerald-soft"
            onClick={() => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  type: "Retail",
                  minPrice: 1_500_000,
                  maxPrice: 4_000_000,
                  minSqft: 8_000,
                  maxSqft: 25_000,
                  minCap: 6.5,
                  maxCap: 11,
                }),
              });
              toast.success("Applied Small-Bay Neighborhood Strip Center Buy Box ($1.5M–$4M, 8k–25k SF)");
            }}
          >
            <Store className="size-3.5" /> Small-Bay Strip Center ($1.5M–$4M, 8k–25k SF)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 border-blue-500/40 bg-blue-500/10 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
            onClick={() => {
              navigate({
                search: (prev) => ({
                  ...prev,
                  type: "Multi-Family",
                  minPrice: 1_000_000,
                  maxPrice: 3_000_000,
                  minCap: 6.0,
                  maxCap: 10,
                }),
              });
              toast.success("Applied 16–32 Unit Multifamily Buy Box ($1M–$3M)");
            }}
          >
            <Building className="size-3.5" /> 16–32 Unit Multifamily ($1M–$3M)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-muted-foreground hover:text-foreground ml-auto"
            onClick={resetFilters}
          >
            Clear Presets
          </Button>
        </div>

        <KpiCards data={summary.data?.data} loading={summary.isLoading} />

        <FilterBar
          draft={draft}
          onChange={setDraft}
          onRun={applyFilters}
          onReset={resetFilters}
          running={listings.isFetching}
        />

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Property Pipeline</h2>
              <span className="num text-sm text-muted-foreground">
                {listings.isFetching ? "loading…" : `${rows.length} assets`}
              </span>
              {search.q ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-soft px-3 py-1 text-xs text-emerald">
                  <Sparkles className="size-3.5" /> AI Vector Match: “{search.q}”
                </span>
              ) : null}
              {search.city || search.state !== "ALL" ? (
                <span className="flex items-center gap-1 rounded-full bg-surface border border-border px-2.5 py-1 text-xs text-muted-foreground">
                  <MapPin className="size-3 text-emerald" /> {search.city ? `${search.city}, ` : ""}{search.state !== "ALL" ? search.state : ""}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border bg-surface/60 p-0.5">
                <button
                  onClick={() => setView("grid")}
                  aria-label="Card view"
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs",
                    search.view !== "table" ? "bg-emerald-soft text-emerald" : "text-muted-foreground",
                  )}
                >
                  <LayoutGrid className="size-3.5" /> Cards
                </button>
                <button
                  onClick={() => setView("table")}
                  aria-label="Table view"
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs",
                    search.view === "table" ? "bg-emerald-soft text-emerald" : "text-muted-foreground",
                  )}
                >
                  <Rows3 className="size-3.5" /> Table
                </button>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
                <Download className="size-3.5" /> Export CSV
              </Button>
            </div>
          </div>

          {listings.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-[520px] rounded-2xl" />
              ))}
            </div>
          ) : !rows.length ? (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-sm font-medium">No assets match these constraints</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Widen the price or cap rate range, or reset the filters to see the full pipeline.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          ) : search.view === "table" ? (
            <PropertyTable listings={rows} onAnalyze={analyze} onGenerateIcMemo={(l) => setIcMemoListing(l)} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 pb-8">
              {rows.map((l) => (
                <PropertyCard
                  key={l.id}
                  listing={l}
                  onAnalyze={analyze}
                  onGenerateIcMemo={(item) => setIcMemoListing(item)}
                />
              ))}
            </div>
          )}

          {rows.length ? (
            <p className="num text-xs text-muted-foreground pt-2">
              Aggregate pipeline value:{" "}
              {money(
                rows.reduce((sum, l) => sum + l.listing_price, 0),
                { compact: true },
              )}
            </p>
          ) : null}
        </section>
      </main>

      <ValuationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} initial={drawerForm} />
      <DemoTourModal open={demoTourOpen} onOpenChange={setDemoTourOpen} onSelectStepAction={handleStepAction} />
      <UnderwriteDealModal open={underwriteOpen} onOpenChange={setUnderwriteOpen} />
      <IcMemoModal listing={icMemoListing} open={Boolean(icMemoListing)} onOpenChange={(o) => !o && setIcMemoListing(null)} />
    </div>
  );
}
