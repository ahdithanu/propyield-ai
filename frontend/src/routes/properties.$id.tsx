import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Building2, ExternalLink, FileText, MapPin } from "lucide-react";
import { useState } from "react";

import { DealScoreBar } from "@/components/property-card";
import { SiteHeader } from "@/components/site-header";
import { IcMemoModal } from "@/components/ic-memo-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ValuationPanel, formFromListing } from "@/components/valuation-panel";
import { listingsQuery } from "@/lib/api";
import { money, money2, num, pct } from "@/lib/format";

const FULL_QUERY = {
  q: "",
  type: "All",
  state: "",
  city: "",
  minPrice: 0,
  maxPrice: 1_000_000_000,
  minCap: 0,
  maxCap: 100,
  minSqft: 0,
  maxSqft: 100_000_000,
};

export const Route = createFileRoute("/properties/$id")({
  head: () => ({
    meta: [
      { title: "Property Detail — PropYield AI" },
      {
        name: "description",
        content:
          "Full underwriting detail for a commercial real estate asset: pricing, cap rate, ML fair value, and deal score.",
      },
      { property: "og:title", content: "Property Detail — PropYield AI" },
      {
        property: "og:description",
        content: "Asset-level CRE underwriting with ML fair value and undervaluation deal score.",
      },
    ],
  }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(listingsQuery(FULL_QUERY));
  const listing = data?.data.find((l) => String(l.id) === String(id) || (l.external_id && String(l.external_id) === String(id)));
  const [icMemoOpen, setIcMemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="size-4" /> Back to pipeline
          </Link>
        </Button>

        {isLoading ? (
          <Skeleton className="h-[420px] rounded-2xl" />
        ) : !listing ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-sm font-medium">Property not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This asset is no longer in the pipeline or the backend returned no match for id {id}.
            </p>
          </div>
        ) : (
          <>
            <div className="glass overflow-hidden rounded-2xl">
              {listing.image_url ? (
                <img
                  src={listing.image_url}
                  alt={`${listing.property_type} asset at ${listing.address}`}
                  width={1024}
                  height={640}
                  className="h-64 w-full object-cover lg:h-80"
                />
              ) : null}
              <div className="space-y-5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge className="border-emerald/30 bg-emerald-soft text-emerald">
                      {listing.property_type}
                    </Badge>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">{listing.title}</h1>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-4" />
                      {listing.address}, {listing.city}, {listing.state} {listing.zip}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-3xl font-semibold">{money(listing.listing_price)}</p>
                    <p className="num text-sm text-emerald">{pct(listing.cap_rate)} cap rate</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Building Size", `${num(listing.sqft)} sqft`],
                    ["Price / Sqft", `${money2(listing.price_per_sqft)}/sqft`],
                    ["ML Fair Value", money(listing.ml_predicted_price)],
                    ["Net Operating Income", listing.noi ? money(listing.noi) : "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-surface-2/60 p-4">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
                      <p className="num mt-1 text-lg font-semibold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="max-w-md">
                  <DealScoreBar listing={listing} />
                </div>

                {listing.description ? (
                  <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {listing.description}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 font-semibold text-emerald border-emerald/30 bg-emerald-soft/30 hover:bg-emerald-soft"
                    onClick={() => setIcMemoOpen(true)}
                  >
                    <FileText className="size-3.5" /> Export IC Deal Memo
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/market-hubs" search={{ hub: listing.city }}>
                      <Building2 className="size-3.5" /> Graph topology for {listing.city}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={listing.external_url ?? "https://www.crexi.com/properties"} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-3.5" /> Direct Listing Source Post
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5 lg:p-6">
              <h2 className="mb-4 text-sm font-semibold">ML Valuation for this asset</h2>
              <ValuationPanel initial={formFromListing(listing)} />
            </div>

            <IcMemoModal listing={listing} open={icMemoOpen} onOpenChange={setIcMemoOpen} />
          </>
        )}
      </main>
    </div>
  );
}
