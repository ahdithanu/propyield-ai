import { ArrowUpRight, Gauge, Layers, Ruler, Sparkles } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { money, num, pct, signedPct } from "@/lib/format";
import type { MarketSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-full", className)}>
      <polyline points={points} fill="none" stroke="var(--emerald)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Bars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-8 items-end gap-1">
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-sm bg-emerald/70"
          style={{ height: `${Math.max((v / max) * 100, 6)}%` }}
        />
      ))}
    </div>
  );
}

function Shell({
  label,
  icon,
  children,
  footer,
  highlight,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass flex flex-col justify-between rounded-2xl p-5",
        highlight && "glow-emerald bg-emerald-soft",
      )}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-emerald">{icon}</span>
      </div>
      <div className="mt-3">{children}</div>
      <div className="mt-3">{footer}</div>
    </div>
  );
}

export function KpiCards({
  data,
  loading,
}: {
  data?: MarketSummary | undefined;
  loading: boolean;
}) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[168px] rounded-2xl" />
        ))}
      </div>
    );
  }

  const benchmarkDelta =
    ((data.median_price_per_sqft - data.regional_benchmark_price_per_sqft) /
      (data.regional_benchmark_price_per_sqft || 1)) *
    100;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Shell
        label="Total Market Inventory"
        icon={<Layers className="size-4" />}
        footer={<Sparkline values={data.inventory_trend_series} />}
      >
        <p className="num text-3xl font-semibold">{money(data.total_inventory_value, { compact: true })}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-emerald">
          <ArrowUpRight className="size-3.5" /> {signedPct(data.inventory_trend_pct)} vs last quarter
        </p>
      </Shell>

      <Shell
        label="Average Market Cap Rate"
        icon={<Gauge className="size-4" />}
        footer={<Bars values={data.cap_rate_distribution} />}
      >
        <p className="num text-3xl font-semibold">{pct(data.avg_cap_rate)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Yield distribution across pipeline</p>
      </Shell>

      <Shell
        label="Median Price / Sqft"
        icon={<Ruler className="size-4" />}
        footer={
          <div className="space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-emerald"
                style={{
                  width: `${Math.min(
                    (data.median_price_per_sqft / (data.regional_benchmark_price_per_sqft || 1)) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>
            <p className="num text-[11px] text-muted-foreground">
              Regional benchmark ${num(data.regional_benchmark_price_per_sqft)} / sqft
            </p>
          </div>
        }
      >
        <p className="num text-3xl font-semibold">${num(data.median_price_per_sqft)}</p>
        <p className="mt-1 num text-xs text-muted-foreground">
          {signedPct(benchmarkDelta)} vs regional benchmark
        </p>
      </Shell>

      <Shell
        highlight
        label="Top Undervalued Opportunities"
        icon={<Sparkles className="size-4" />}
        footer={
          <p className="text-[11px] text-emerald/80">
            Flagged by the ML valuation model within the last 24h
          </p>
        }
      >
        <p className="num text-3xl font-semibold text-emerald">{data.undervalued_count} Deals Flagged</p>
        <p className="mt-1 text-xs text-emerald/80">Trading below modeled fair market value</p>
      </Shell>
    </div>
  );
}
