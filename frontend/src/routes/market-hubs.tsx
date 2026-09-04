import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Network, Share2 } from "lucide-react";
import { useState } from "react";

import { HubGraph } from "@/components/hub-graph";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { marketHubsQuery } from "@/lib/api";
import { pct } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market-hubs")({
  validateSearch: (search: { hub?: unknown }): { hub?: string } =>
    typeof search["hub"] === "string" && search["hub"] ? { hub: search["hub"] } : {},
  head: () => ({
    meta: [
      { title: "Graph Topology & Market Hubs — PropYield AI" },
      {
        name: "description",
        content:
          "Commercial real estate market hubs ranked by PageRank centrality, with node connection counts and multi-hop neighborhood exploration.",
      },
      { property: "og:title", content: "Graph Topology & Market Hubs — PropYield AI" },
      {
        property: "og:description",
        content:
          "Explore CRE submarket graph centrality: top hubs by PageRank, connection density, and multi-hop neighbor networks.",
      },
    ],
  }),
  component: MarketHubsPage,
});

function MarketHubsPage() {
  const { hub: hubParam = "" } = Route.useSearch();
  const { data, isLoading } = useQuery(marketHubsQuery());
  const hubs = data?.data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [maxHop, setMaxHop] = useState("2");

  const preferred = hubParam
    ? hubs.find((h) => h.city.toLowerCase() === hubParam.toLowerCase())
    : undefined;
  const selected = hubs.find((h) => h.id === selectedId) ?? preferred ?? hubs[0];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-8 lg:px-8">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Graph Topology &amp; Market Hubs</h1>
          <p className="text-sm text-muted-foreground">
            Submarkets ranked by PageRank centrality across the property–tenant–submarket knowledge graph.
          </p>
        </section>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <Skeleton className="h-[520px] rounded-2xl" />
            <Skeleton className="h-[520px] rounded-2xl" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="glass rounded-2xl p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Network className="size-4 text-emerald" /> Top CRE Market Hubs by PageRank
              </h2>
              <ol className="space-y-2">
                {hubs.map((h, i) => (
                  <li key={h.id}>
                    <button
                      onClick={() => setSelectedId(h.id)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors",
                        selected?.id === h.id
                          ? "border-emerald/40 bg-emerald-soft"
                          : "border-border bg-surface-2/40 hover:border-emerald/25",
                      )}
                    >
                      <span
                        className={cn(
                          "num flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
                          i === 0 ? "bg-emerald text-primary-foreground" : "bg-surface-2 text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{h.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {h.city}, {h.state} · avg cap {pct(h.avg_cap_rate)}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="num block text-sm font-semibold text-emerald">
                          {h.pagerank.toFixed(3)}
                        </span>
                        <span className="num block text-[11px] text-muted-foreground">
                          {h.connections} nodes
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Share2 className="size-4 text-emerald" /> Multi-Hop Neighborhood
                </h2>
                <Tabs value={maxHop} onValueChange={setMaxHop}>
                  <TabsList>
                    <TabsTrigger value="1">1 hop</TabsTrigger>
                    <TabsTrigger value="2">2 hops</TabsTrigger>
                    <TabsTrigger value="3">3 hops</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {selected ? (
                <>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="border-emerald/30 text-emerald">
                      {selected.name}
                    </Badge>
                    <span className="num text-xs text-muted-foreground">
                      {selected.connections} connections · PageRank {selected.pagerank.toFixed(3)}
                    </span>
                  </div>
                  <HubGraph hub={selected} maxHop={Number(maxHop)} />
                  <ul className="mt-2 space-y-1.5">
                    {selected.neighbors
                      .filter((n) => n.hop <= Number(maxHop))
                      .map((n) => (
                        <li
                          key={n.name}
                          className="flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2 text-xs"
                        >
                          <span>{n.name}</span>
                          <span className="num text-muted-foreground">
                            hop {n.hop} · weight {n.weight.toFixed(2)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">No hub graph available.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
