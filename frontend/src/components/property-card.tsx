import { Link } from "@tanstack/react-router";
import { Calculator, ExternalLink, MapPin, Network } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dealVerdict, money, money2, num, pct } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DealScoreBar({ listing }: { listing: Listing }) {
  const verdict = dealVerdict(listing.deal_score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Undervaluation Deal Score</span>
        <span className="num font-semibold">{listing.deal_score}/100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn(
            "h-full rounded-full",
            verdict.tone === "emerald" ? "bg-emerald" : verdict.tone === "warn" ? "bg-warn" : "bg-muted-foreground",
          )}
          style={{ width: `${Math.min(Math.max(listing.deal_score, 2), 100)}%` }}
        />
      </div>
      <Badge
        variant="outline"
        className={cn(
          "num w-full justify-center py-1 text-[11px] font-semibold tracking-wide",
          verdict.tone === "emerald"
            ? "border-emerald/40 bg-emerald-soft text-emerald"
            : verdict.tone === "warn"
              ? "border-warn/40 text-warn"
              : "text-muted-foreground",
        )}
      >
        {verdict.label} — {Math.abs(listing.undervaluation_pct).toFixed(0)}%{" "}
        {listing.undervaluation_pct >= 0 ? "Below" : "Above"} ML Market Value
      </Badge>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="num mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

export function PropertyCard({
  listing,
  onAnalyze,
}: {
  listing: Listing;
  onAnalyze: (listing: Listing) => void;
}) {
  return (
    <article className="glass group flex flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-[0_0_40px_-16px_var(--emerald)]">
      <Link to="/properties/$id" params={{ id: listing.id }} className="relative aspect-[16/9] overflow-hidden bg-surface-2 block">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={`${listing.property_type} property at ${listing.address}, ${listing.city}`}
            loading="lazy"
            width={1024}
            height={640}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
        <Badge className="absolute left-3 top-3 border-emerald/30 bg-background/80 text-emerald backdrop-blur">
          {listing.property_type}
        </Badge>
        <span className="num absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-emerald backdrop-blur">
          {pct(listing.cap_rate)} cap
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <Link to="/properties/$id" params={{ id: listing.id }} className="hover:text-emerald transition-colors">
            <h3 className="text-sm font-semibold leading-snug">{listing.title}</h3>
          </Link>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {[listing.address, listing.city].filter(Boolean).join(", ")} {listing.state} {listing.zip}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Listing Price" value={money(listing.listing_price, { compact: true })} />
          <Stat label="Cap Rate" value={pct(listing.cap_rate)} />
          <Stat label="Sqft" value={`${num(listing.sqft)} sqft`} />
          <Stat label="Price / Sqft" value={`${money2(listing.price_per_sqft)}/sqft`} />
        </div>

        <DealScoreBar listing={listing} />

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button size="sm" className="col-span-2 gap-1.5 font-semibold" onClick={() => onAnalyze(listing)}>
            <Calculator className="size-3.5" /> Analyze Valuation
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to="/market-hubs" search={{ hub: listing.city }}>
              <Network className="size-3.5" /> Graph
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary" className="gap-1.5">
            <Link to="/properties/$id" params={{ id: listing.id }}>
              <ExternalLink className="size-3.5" /> View Detail
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
