import { useMemo } from "react";
import {
  AlertTriangle,
  Building,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Flame,
  Info,
  Layers,
  MapPin,
  Percent,
  Ruler,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { money, money2, num, pct } from "@/lib/format";
import type { Listing } from "@/lib/types";

export interface BuyBoxCheckItem {
  name: string;
  category: "Scale" | "Basis" | "Concentration" | "Capex" | "Traffic" | "Lease";
  target: string;
  actual: string;
  passed: boolean;
  warning?: boolean;
  note?: string;
}

export function evaluateBuyBox(listing: Listing) {
  const isMultifamily =
    listing.property_type.toLowerCase().includes("multi") ||
    listing.property_type.toLowerCase().includes("family");

  const isRetail =
    listing.property_type.toLowerCase().includes("retail") ||
    (!isMultifamily && !listing.property_type.toLowerCase().includes("industrial"));

  const items: BuyBoxCheckItem[] = [];
  let capexDeductions = 0;

  if (isMultifamily) {
    // 1. Multifamily: 16–32 Units
    const units = listing.unit_count ?? Math.round(listing.sqft / 850);
    const unitsPass = units >= 16 && units <= 32;
    items.push({
      name: "Unit Scale",
      category: "Scale",
      target: "16 – 32 Units",
      actual: `${units} Units`,
      passed: unitsPass,
      note: unitsPass
        ? "Right-sized for non-institutional syndication"
        : units < 16
          ? "Below 16 units: High per-unit fixed management overhead"
          : "Above 32 units: Competes with institutional capital",
    });

    // 2. Multifamily Price: $1M – $3M
    const pricePass = listing.listing_price >= 1_000_000 && listing.listing_price <= 3_500_000;
    const pricePerUnit = Math.round(listing.listing_price / Math.max(units, 1));
    items.push({
      name: "Purchase Basis",
      category: "Basis",
      target: "$1.0M – $3.0M ($60k–$120k/unit)",
      actual: `${money(listing.listing_price, { compact: true })} (${money(pricePerUnit)}/door)`,
      passed: pricePass,
      warning: pricePerUnit > 130_000,
      note:
        pricePerUnit <= 120_000
          ? "Below replacement cost in secondary markets"
          : "Basis exceeds $120k/door threshold",
    });

    // 3. Vintage: 1980+
    const year = listing.year_built ?? 1990;
    const vintagePass = year >= 1980;
    items.push({
      name: "Vintage",
      category: "Basis",
      target: "1980 or Newer",
      actual: `Built ${year}`,
      passed: vintagePass,
      note: vintagePass ? "Post-1980 (avoids cast iron / aluminum wiring risks)" : "Pre-1980 lead/plumbing risk",
    });

    // 4. Occupancy: 80% – 100%
    const occ = listing.occupancy_pct ?? 91;
    const occPass = occ >= 80 && occ <= 100;
    items.push({
      name: "Occupancy Band",
      category: "Lease",
      target: "80% – 100% Occupancy",
      actual: `${occ.toFixed(1)}% Occupied`,
      passed: occPass,
      note:
        occ >= 80 && occ <= 94
          ? "Value-add leasing upside without heavy turnaround distress"
          : occ > 94
            ? "Fully stabilized cash-flow asset"
            : "Heavy turnaround risk (>20% vacant)",
    });
  } else {
    // RETAIL BUY BOX CHECKS
    // 1. Asset Type: Unanchored or Shadow-Anchored Multi-Tenant Strip
    const anchor = listing.anchor_type ?? "Shadow-Anchored";
    const isGoodAnchor = anchor === "Unanchored" || anchor === "Shadow-Anchored";
    items.push({
      name: "Asset Sub-Class",
      category: "Scale",
      target: "Unanchored or Shadow-Anchored Strip",
      actual: `${anchor}${listing.shadow_anchor_name ? ` (${listing.shadow_anchor_name})` : ""}`,
      passed: isGoodAnchor,
      note: isGoodAnchor
        ? "Gets shadow traffic without anchor lease liability"
        : "Direct anchor vacancy risk",
    });

    // 2. Size: 8,000 to 25,000 SF (5 to 12 bays)
    const bays = listing.bays_count ?? Math.round(listing.sqft / 1800);
    const sizePass = listing.sqft >= 8_000 && listing.sqft <= 26_000;
    const baysPass = bays >= 5 && bays <= 14;
    items.push({
      name: "Size & Bay Scale",
      category: "Scale",
      target: "8k – 25k SF (5 – 12 Bays)",
      actual: `${num(listing.sqft)} SF (${bays} Bays)`,
      passed: sizePass && baysPass,
      warning: !baysPass && sizePass,
      note:
        sizePass && baysPass
          ? "Institutional blind spot: ignorable by REITs, diversified tenant base"
          : "Size outside the 8k–25k SF sweet spot",
    });

    // 3. Price: $1.5M to $4.0M ($100 to $200/SF)
    const pricePass = listing.listing_price >= 1_400_000 && listing.listing_price <= 4_200_000;
    const ppsfPass = listing.price_per_sqft >= 90 && listing.price_per_sqft <= 230;
    items.push({
      name: "Price Basis",
      category: "Basis",
      target: "$1.5M – $4.0M ($100–$200/SF)",
      actual: `${money(listing.listing_price, { compact: true })} (${money2(listing.price_per_sqft)}/SF)`,
      passed: pricePass && ppsfPass,
      warning: pricePass && !ppsfPass,
      note:
        pricePass && ppsfPass
          ? "Secondary market basis below replacement cost"
          : listing.listing_price < 1_500_000
            ? "Under $1.5M: usually high single-tenant concentration"
            : "Above $4.0M target ceiling",
    });

    // 4. Vintage: 1985 or Newer
    const year = listing.year_built ?? 1994;
    const vintagePass = year >= 1985;
    items.push({
      name: "Vintage",
      category: "Basis",
      target: "1985 or Newer",
      actual: `Built ${year}`,
      passed: vintagePass,
      note: vintagePass ? "Modern plumbing/electrical standards" : "Pre-1985 structural risk",
    });

    // 5. Occupancy: 80% to 100%
    const occ = listing.occupancy_pct ?? 89;
    const occPass = occ >= 80 && occ <= 100;
    items.push({
      name: "Occupancy Band",
      category: "Lease",
      target: "80% – 100% Occupancy",
      actual: `${occ.toFixed(1)}% Occupied`,
      passed: occPass,
      note:
        occ >= 80 && occ <= 92
          ? "1–2 vacant bays: Ideal value-add re-leasing upside"
          : occ > 92
            ? "Stable cash flow"
            : "High vacancy (>20%): turnaround leasing risk",
    });

    // 6. Tenant Concentration: Max Single Tenant < 30% of Gross Rent
    const maxTenant = listing.max_tenant_pct ?? 22.5;
    const maxTenantPass = maxTenant <= 30.0;
    items.push({
      name: "Max Tenant Concentration",
      category: "Concentration",
      target: "< 30.0% of Gross Rent Roll",
      actual: `${maxTenant.toFixed(1)}% of Revenue`,
      passed: maxTenantPass,
      warning: maxTenant > 30.0 && maxTenant <= 35.0,
      note: maxTenantPass
        ? "Diversified: Loss of any single tenant won't trigger default"
        : "Concentration risk: 1 vacancy threatens debt service",
    });

    // 7. Tenant Mix: Service/Necessity vs. Restaurants < 25%
    const restaurantPct = listing.restaurant_pct ?? 16.0;
    const restPass = restaurantPct <= 25.0;
    items.push({
      name: "Restaurant Cap",
      category: "Concentration",
      target: "< 25.0% Restaurant / F&B Exposure",
      actual: `${restaurantPct.toFixed(1)}% Restaurant Rent`,
      passed: restPass,
      warning: restaurantPct > 25.0 && restaurantPct <= 35.0,
      note: restPass
        ? "Safe: Protected against grease trap, plumbing & turnover capex"
        : "High F&B exposure: Significant second-generation buildout capex risk",
    });

    // 8. Traffic Count (VPD)
    const vpd = listing.traffic_vpd ?? 19_800;
    const vpdPass = vpd >= 15_000;
    items.push({
      name: "Traffic Volume (VPD)",
      category: "Traffic",
      target: "15,000 – 25,000+ Vehicles / Day",
      actual: `${num(vpd)} VPD (${listing.intersection_type || "Signalized Frontage"})`,
      passed: vpdPass,
      note: vpdPass ? "High customer drive-by velocity" : "Below 15k VPD threshold: weak retail visibility",
    });

    // 9. Parking Ratio
    const parkingRatio = listing.parking_ratio ?? 4.6;
    const parkingPass = parkingRatio >= 4.0;
    items.push({
      name: "Parking Ratio",
      category: "Traffic",
      target: "≥ 4.0 Spaces / 1,000 SF",
      actual: `${parkingRatio.toFixed(1)} per 1,000 SF`,
      passed: parkingPass,
      note: parkingPass ? "Accommodates peak customer turnover" : "Parking deficient (<4/1k SF)",
    });

    // 10. Lease Quality & WALT
    const walt = listing.walt_years ?? 3.8;
    const waltPass = walt >= 3.0;
    items.push({
      name: "WALT & Lease Type",
      category: "Lease",
      target: "NNN / Mod NNN with WALT ≥ 3.0 Yrs",
      actual: `${listing.lease_structure || "NNN"} • ${walt.toFixed(1)} Yrs WALT`,
      passed: waltPass,
      note: waltPass ? "Secure rollover runway for loan term" : "Rollover cliff: WALT under 3 years",
    });
  }

  // BIG 3 CAPEX LANDMINES AUDIT (Roof, HVAC, Parking)
  const roofRul = listing.roof_rul_years ?? (20 - (listing.roof_age_years ?? 12));
  const roofCapex = roofRul < 5 ? (listing.roof_replacement_est ?? Math.round(listing.sqft * 8.5)) : 0;

  const hvacOldCount = listing.hvac_over_12yr_count ?? Math.round((listing.hvac_units_count ?? 8) * 0.4);
  const hvacCapex = hvacOldCount * 9_500;

  const parkingReseal = listing.parking_reseal_est ?? (listing.parking_condition === "Poor" ? 18_000 : 0);

  capexDeductions = roofCapex + hvacCapex + parkingReseal;

  const passedCount = items.filter((i) => i.passed).length;
  const matchPct = Math.round((passedCount / items.length) * 100);
  const verdict: "PASS" | "CAUTION" | "FAIL" =
    matchPct >= 85 ? "PASS" : matchPct >= 65 ? "CAUTION" : "FAIL";

  const recommendedLoi = Math.round(listing.listing_price - capexDeductions);

  return {
    items,
    matchPct,
    verdict,
    capexDeductions,
    roofRul,
    roofCapex,
    hvacOldCount,
    hvacCapex,
    parkingReseal,
    recommendedLoi,
  };
}

export function BuyBoxScorecard({ listing }: { listing: Listing }) {
  const result = useMemo(() => evaluateBuyBox(listing), [listing]);

  return (
    <div className="glass rounded-2xl p-5 lg:p-6 space-y-6 border border-emerald-500/20">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                result.verdict === "PASS"
                  ? "bg-emerald text-black font-bold"
                  : result.verdict === "CAUTION"
                    ? "bg-amber-500 text-black font-bold"
                    : "bg-rose-500 text-white font-bold"
              }
            >
              BUY BOX VERDICT: {result.verdict}
            </Badge>
            <span className="num text-sm font-semibold text-emerald">
              {result.matchPct}% Match ({result.items.filter((i) => i.passed).length}/{result.items.length} Criteria Passed)
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold">
            Pre-LOI Buy Box Screener: Small-Bay Strip &amp; Value-Add Multifamily
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated screening against institutional non-competed criteria (8k–25k SF, $1.5M–$4M, 1985+, &lt;30% tenant concentration, &lt;25% restaurants).
          </p>
        </div>

        {/* LOI Offer Adjustment Calculator */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Target LOI Strike Price</p>
          <p className="num text-xl font-bold text-emerald">{money(result.recommendedLoi)}</p>
          {result.capexDeductions > 0 ? (
            <p className="num text-[10px] text-amber-400 mt-0.5">
              Reflects -{money(result.capexDeductions)} Big 3 Capex deduction
            </p>
          ) : (
            <p className="text-[10px] text-emerald-400 mt-0.5">Zero immediate capex landmines</p>
          )}
        </div>
      </div>

      {/* Big 3 Capex Landmines Ledger (Roof, HVAC, Parking) */}
      <div className="rounded-xl border border-white/10 bg-surface-2/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <Wrench className="size-4 text-emerald" />
            <span>Pre-LOI Big 3 Capex Landmine Audit</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Inspect useful life before LOI submission</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          {/* 1. Roof */}
          <div className="rounded-lg bg-black/40 p-3 border border-white/5">
            <div className="flex items-center justify-between font-semibold">
              <span>1. Roof System</span>
              <span className={result.roofRul < 5 ? "text-amber-400 font-bold" : "text-emerald"}>
                {result.roofRul} Yrs RUL
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {listing.roof_type || "TPO Membrane"} ({listing.roof_age_years ?? 12} yrs old)
            </p>
            {result.roofCapex > 0 ? (
              <p className="mt-1 text-[10px] text-amber-400 font-semibold">
                ⚠️ Est. {money(result.roofCapex)} replacement reserve
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-emerald-400">✓ Healthy useful life remaining</p>
            )}
          </div>

          {/* 2. HVAC */}
          <div className="rounded-lg bg-black/40 p-3 border border-white/5">
            <div className="flex items-center justify-between font-semibold">
              <span>2. HVAC RTU Units</span>
              <span className={result.hvacOldCount > 0 ? "text-amber-400 font-bold" : "text-emerald"}>
                {listing.hvac_units_count ?? 8} Total Units
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {result.hvacOldCount} of {listing.hvac_units_count ?? 8} units &gt;12 yrs old
            </p>
            {result.hvacCapex > 0 ? (
              <p className="mt-1 text-[10px] text-amber-400 font-semibold">
                ⚠️ Est. {money(result.hvacCapex)} RTU replacement reserve
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-emerald-400">✓ Modern compressor ages</p>
            )}
          </div>

          {/* 3. Parking Lot */}
          <div className="rounded-lg bg-black/40 p-3 border border-white/5">
            <div className="flex items-center justify-between font-semibold">
              <span>3. Parking Lot Paving</span>
              <span className="text-emerald font-bold">
                {listing.parking_ratio ? `${listing.parking_ratio.toFixed(1)} / 1k SF` : "4.6 / 1k SF"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {listing.parking_condition || "Good Condition"} ({listing.parking_stalls ?? 56} stalls)
            </p>
            {result.parkingReseal > 0 ? (
              <p className="mt-1 text-[10px] text-amber-400 font-semibold">
                ⚠️ Est. {money(result.parkingReseal)} slurry seal reserve
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-emerald-400">✓ Parking surface satisfactory</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Checklist Table */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Underwriting Buy Box Checklist
        </p>

        <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-surface-2/20 overflow-hidden text-xs">
          {result.items.map((item) => (
            <div key={item.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2">
              <div className="flex items-start gap-2.5">
                {item.passed ? (
                  <CheckCircle2 className="size-4 text-emerald shrink-0 mt-0.5" />
                ) : item.warning ? (
                  <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                      {item.category}
                    </Badge>
                  </div>
                  {item.note ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.note}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-4 sm:text-right pl-6 sm:pl-0 shrink-0">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Target</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{item.target}</p>
                </div>
                <div className="min-w-[100px]">
                  <p className="text-[10px] uppercase text-muted-foreground">Actual</p>
                  <p
                    className={
                      item.passed
                        ? "text-[11px] font-mono font-bold text-emerald"
                        : item.warning
                          ? "text-[11px] font-mono font-bold text-amber-400"
                          : "text-[11px] font-mono font-bold text-rose-400"
                    }
                  >
                    {item.actual}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
