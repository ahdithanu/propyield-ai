import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Download, LayoutGrid, Rows3, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DEFAULT_DRAFT, FilterBar, type FilterDraft } from "@/components/filter-bar";
import { KpiCards } from "@/components/kpi-cards";
import { PropertyCard } from "@/components/property-card";
import { PropertyTable } from "@/components/property-table";
import { SiteHeader } from "@/components/site-header";
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
  const rows = listings.data?.data ?? [];

  useEffect(() => {
    if (search.q && listings.data && !listings.isFetching) {
      toast.success(`Semantic search returned ${listings.data.data.length} matches`);
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
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        {offline ? (
          <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
            <p className="text-foreground/90">
              <span className="font-semibold text-warn">Backend offline.</span> The FastAPI service at
              the configured <code className="num text-xs">/api/v1</code> base URL is unreachable, so
              demo intelligence data is displayed. Start the backend to see live pipeline results.
            </p>
          </div>
        ) : null}

        <section className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Commercial Deal Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            ML-scored valuation, vector search, and graph centrality across the live CRE pipeline.
          </p>
        </section>

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
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold">Property Pipeline</h2>
              <span className="num text-sm text-muted-foreground">
                {listings.isFetching ? "loading…" : `${rows.length} assets`}
              </span>
              {search.q ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-soft px-2.5 py-1 text-xs text-emerald">
                  <Sparkles className="size-3" /> “{search.q}”
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
            <PropertyTable listings={rows} onAnalyze={analyze} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {rows.map((l) => (
                <PropertyCard key={l.id} listing={l} onAnalyze={analyze} />
              ))}
            </div>
          )}

          {rows.length ? (
            <p className="num text-xs text-muted-foreground">
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
    </div>
  );
}
