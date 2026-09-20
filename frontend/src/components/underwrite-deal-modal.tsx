import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle2,
  Compass,
  DollarSign,
  Layers,
  MapPin,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Truck,
  Wrench,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/lib/types";

interface UnderwriteDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealCreated?: (deal: Listing) => void;
}

export function UnderwriteDealModal({ open, onOpenChange, onDealCreated }: UnderwriteDealModalProps) {
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState("Oakridge Small-Bay Retail Strip");
  const [address, setAddress] = useState("4120 E Dublin Granville Rd");
  const [city, setCity] = useState("Columbus");
  const [state, setState] = useState("OH");
  const [zip, setZip] = useState("43231");
  const [type, setType] = useState("Retail");

  const [price, setPrice] = useState(2_250_000);
  const [sqft, setSqft] = useState(12_400);
  const [capRate, setCapRate] = useState(7.4);
  const [yearBuilt, setYearBuilt] = useState(1994);

  // Buy Box Specifics
  const [baysCount, setBaysCount] = useState(7);
  const [occupancyPct, setOccupancyPct] = useState(88.5);
  const [maxTenantPct, setMaxTenantPct] = useState(22.0);
  const [restaurantPct, setRestaurantPct] = useState(14.0);
  const [trafficVpd, setTrafficVpd] = useState(19_200);
  const [parkingRatio, setParkingRatio] = useState(4.6);
  const [roofAge, setRoofAge] = useState(12);
  const [hvacUnits, setHvacUnits] = useState(7);
  const [hvacOver12yr, setHvacOver12yr] = useState(3);
  const [tenantName, setTenantName] = useState("State Farm / Great Clips / Dental Care");
  const [tenantDomain, setTenantDomain] = useState("statefarm.com");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const pricePerSqft = Math.round(price / Math.max(sqft, 1));
    const ppsfValuation = type === "Retail" ? 195 : 120;
    const fairMarketPrice = Math.round(sqft * ppsfValuation);
    const undervaluationPct = Number((((fairMarketPrice - price) / fairMarketPrice) * 100).toFixed(1));
    const dealScore = Math.min(99, Math.max(1, Math.round(50 + undervaluationPct * 2.2)));

    // Approximate geocodes for known cities or fallback
    const cityCoords: Record<string, [number, number]> = {
      Columbus: [40.0992, -82.9071],
      Indianapolis: [39.7684, -86.1581],
      Nashville: [36.1627, -86.7816],
      Tampa: [27.9506, -82.4572],
      Austin: [30.2672, -97.7431],
      Dallas: [32.7767, -96.797],
      Atlanta: [33.749, -84.388],
    };

    const [lat, lng] = cityCoords[city] ?? [39.7684, -86.1581];

    const newDeal: Listing = {
      id: `deal-${Date.now()}`,
      title,
      address,
      city,
      state,
      zip,
      property_type: type,
      listing_price: price,
      cap_rate: capRate,
      sqft,
      price_per_sqft: pricePerSqft,
      deal_score: dealScore,
      ml_predicted_price: fairMarketPrice,
      undervaluation_pct: undervaluationPct,
      latitude: lat,
      longitude: lng,
      tenant_name: tenantName,
      tenant_domain: tenantDomain,
      parcel_id: `${state.toUpperCase()}-CAD-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`,
      lot_size_acres: Number((sqft / 10000).toFixed(2)),
      lot_size_sqft: Math.round(sqft * 4.3),
      zoning_code: type === "Retail" ? "C-2 General Commercial" : "R-4 Multi-Family",
      county: `${city} Central Appraisal District`,
      county_gis_url: "https://www.google.com/search?q=" + encodeURIComponent(`${city} ${state} county GIS parcel search`),
      bays_count: baysCount,
      anchor_type: "Shadow-Anchored",
      shadow_anchor_name: "Adjacent to Kroger / Target",
      occupancy_pct: occupancyPct,
      max_tenant_pct: maxTenantPct,
      restaurant_pct: restaurantPct,
      service_tenant_pct: 100 - restaurantPct,
      roof_type: "TPO Membrane",
      roof_age_years: roofAge,
      roof_rul_years: Math.max(1, 20 - roofAge),
      roof_replacement_est: roofAge > 15 ? Math.round(sqft * 8.5) : 0,
      hvac_units_count: hvacUnits,
      hvac_avg_age_years: roofAge,
      hvac_over_12yr_count: hvacOver12yr,
      hvac_replacement_est: hvacOver12yr * 9500,
      parking_stalls: Math.round((sqft / 1000) * parkingRatio),
      parking_ratio: parkingRatio,
      parking_condition: "Good Asphalt",
      traffic_vpd: trafficVpd,
      intersection_type: "Signalized Corner with Dedicated Turn Bay",
      lease_structure: "NNN",
      walt_years: 3.8,
      in_place_rent_psf: 17.5,
      market_rent_psf: 19.5,
      year_built: yearBuilt,
      noi: Math.round((price * capRate) / 100),
      description: `User-underwritten ${type.toLowerCase()} asset in ${city}, ${state}. Evaluated against personal acquisition buy box criteria.`,
      external_url: "https://www.crexi.com/properties",
    };

    // Save to localStorage for instant persistence across pages
    try {
      const stored = localStorage.getItem("propyield_custom_deals");
      const list: Listing[] = stored ? JSON.parse(stored) : [];
      list.unshift(newDeal);
      localStorage.setItem("propyield_custom_deals", JSON.stringify(list));
    } catch {
      // ignore
    }

    if (onDealCreated) {
      onDealCreated(newDeal);
    }

    onOpenChange(false);
    navigate({ to: "/properties/$id", params: { id: newDeal.id } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge className="border-emerald/30 bg-emerald-soft text-emerald gap-1">
              <Sparkles className="size-3" /> Live Deal Underwriting Wizard
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold mt-2">
            Underwrite Any Live Property Against Your Buy Box
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter any off-market address, broker OM numbers, or Crexi listing to immediately generate your Pre-LOI Buy Box Scorecard, Capex deductions, and Cadastral parcel overlay.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Section 1: Property Identity & Location */}
          <div className="rounded-xl border border-white/10 bg-surface-2/40 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald flex items-center gap-1.5">
              <MapPin className="size-3.5" /> 1. Property Identity &amp; Physical Address
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-muted-foreground font-semibold">Deal Title / Headline</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                  placeholder="e.g. Dublin Granville Small-Bay Strip"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold">State</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground font-semibold">Zip</label>
                  <input
                    type="text"
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Financials & Size */}
          <div className="rounded-xl border border-white/10 bg-surface-2/40 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald flex items-center gap-1.5">
              <DollarSign className="size-3.5" /> 2. Pricing, Basis &amp; Size
            </h4>

            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Asking Price ($)</label>
                <input
                  type="number"
                  required
                  step={25000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Building Sqft</label>
                <input
                  type="number"
                  required
                  step={500}
                  value={sqft}
                  onChange={(e) => setSqft(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">In-Place Cap Rate (%)</label>
                <input
                  type="number"
                  required
                  step={0.05}
                  value={capRate}
                  onChange={(e) => setCapRate(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Vintage (Year Built)</label>
                <input
                  type="number"
                  required
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Buy Box Criteria (Bays, Concentration, Capex) */}
          <div className="rounded-xl border border-white/10 bg-surface-2/40 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> 3. Your Buy Box Criteria
            </h4>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Bays / Unit Count (Target 5-12)</label>
                <input
                  type="number"
                  value={baysCount}
                  onChange={(e) => setBaysCount(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Occupancy % (Target 80-100%)</label>
                <input
                  type="number"
                  step={0.5}
                  value={occupancyPct}
                  onChange={(e) => setOccupancyPct(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Max Single Tenant % (Cap &lt;30%)</label>
                <input
                  type="number"
                  step={0.5}
                  value={maxTenantPct}
                  onChange={(e) => setMaxTenantPct(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Restaurant Rent % (Cap &lt;25%)</label>
                <input
                  type="number"
                  step={0.5}
                  value={restaurantPct}
                  onChange={(e) => setRestaurantPct(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Traffic (Target 15k–25k VPD)</label>
                <input
                  type="number"
                  step={500}
                  value={trafficVpd}
                  onChange={(e) => setTrafficVpd(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Parking Ratio (Target ≥4.0/1k)</label>
                <input
                  type="number"
                  step={0.1}
                  value={parkingRatio}
                  onChange={(e) => setParkingRatio(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>
            </div>

            {/* Big 3 Capex Inputs */}
            <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t border-white/10">
              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Roof Age (Years)</label>
                <input
                  type="number"
                  value={roofAge}
                  onChange={(e) => setRoofAge(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">Total HVAC RTUs</label>
                <input
                  type="number"
                  value={hvacUnits}
                  onChange={(e) => setHvacUnits(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground font-semibold">HVAC Units &gt;12 Yrs Old</label>
                <input
                  type="number"
                  value={hvacOver12yr}
                  onChange={(e) => setHvacOver12yr(Number(e.target.value))}
                  className="w-full mt-1 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-foreground focus:border-emerald focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-emerald text-black font-bold hover:bg-emerald/90 gap-1.5">
              <Sparkles className="size-3.5" /> Run Buy Box Underwriting &amp; Scorecard
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
