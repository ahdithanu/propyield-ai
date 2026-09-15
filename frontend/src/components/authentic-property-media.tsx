import { useState, useMemo } from "react";
import { Camera, Eye, Globe, MapPin, Satellite, ShieldCheck, Sparkles, Building, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getStreetViewStaticUrl,
  getSatelliteStaticUrl,
  getTenantFaviconUrl,
  formatCoordinates,
} from "@/lib/authentic-imagery";
import { CreBlueprintBadge } from "@/components/cre-blueprint-badge";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MediaViewMode = "streetview" | "satellite" | "blueprint";

interface AuthenticPropertyMediaProps {
  listing: Listing;
  aspectRatio?: "video" | "wide" | "hero";
  interactive?: boolean;
  className?: string;
  defaultView?: MediaViewMode;
}

export function AuthenticPropertyMedia({
  listing,
  aspectRatio = "video",
  interactive = true,
  className = "",
  defaultView,
}: AuthenticPropertyMediaProps) {
  const [activeView, setActiveView] = useState<MediaViewMode>(defaultView ?? "streetview");
  const [streetViewFailed, setStreetViewFailed] = useState(false);
  const [satelliteFailed, setSatelliteFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  // Compute geocoding & URLs
  const locationCoords = useMemo(
    () => ({
      lat: listing.latitude,
      lng: listing.longitude,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip: listing.zip,
    }),
    [listing]
  );

  const streetViewUrl = useMemo(
    () => getStreetViewStaticUrl(locationCoords, { size: "800x450", fov: 90, pitch: 10 }),
    [locationCoords]
  );

  const satelliteUrl = useMemo(
    () =>
      getSatelliteStaticUrl(locationCoords, {
        size: "800x450",
        zoom: 18,
        boundary: listing.parcel_boundary,
        showParcelBoundary: true,
      }),
    [locationCoords, listing.parcel_boundary]
  );

  const tenantFaviconUrl = useMemo(
    () => getTenantFaviconUrl(listing.tenant_domain, 128),
    [listing.tenant_domain]
  );

  const formattedCoords = useMemo(
    () => formatCoordinates(listing.latitude, listing.longitude),
    [listing.latitude, listing.longitude]
  );

  // Determine current effective view based on graceful degradation
  const currentView: MediaViewMode = useMemo(() => {
    if (activeView === "streetview") {
      if (!streetViewUrl || streetViewFailed) {
        return !satelliteFailed && satelliteUrl ? "satellite" : "blueprint";
      }
      return "streetview";
    }
    if (activeView === "satellite") {
      if (!satelliteUrl || satelliteFailed) {
        return "blueprint";
      }
      return "satellite";
    }
    return "blueprint";
  }, [activeView, streetViewUrl, streetViewFailed, satelliteUrl, satelliteFailed]);

  const aspectClass =
    aspectRatio === "hero"
      ? "aspect-[16/9] lg:aspect-[21/9]"
      : aspectRatio === "wide"
        ? "aspect-[16/9] sm:aspect-[2/1]"
        : "aspect-[16/9]";

  return (
    <div className={cn("relative group overflow-hidden bg-[#09111e] rounded-xl", aspectClass, className)}>
      {/* Tier 1: Street View Static View */}
      {currentView === "streetview" && streetViewUrl ? (
        <img
          src={streetViewUrl}
          alt={`Ground-truth street view of ${listing.title} at ${listing.address}`}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
          onError={() => setStreetViewFailed(true)}
        />
      ) : null}

      {/* Tier 2: Satellite Aerial Parcel View */}
      {currentView === "satellite" && satelliteUrl ? (
        <img
          src={satelliteUrl}
          alt={`Aerial satellite view of ${listing.title} at ${listing.address}`}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
          onError={() => setSatelliteFailed(true)}
        />
      ) : null}

      {/* Tier 4: The "Anti-Stock" Rule CRE Asset-Class Vector Blueprint Badge */}
      {currentView === "blueprint" ? (
        <CreBlueprintBadge listing={listing} className="size-full" />
      ) : null}

      {/* Subtle bottom gradient for readability of overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Tier 3: Real Brand Asset Scraper (Verified Tenant / Broker Favicon Badge) */}
      {listing.tenant_domain && !logoFailed && tenantFaviconUrl ? (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-black/85 px-2.5 py-1 text-xs font-semibold text-emerald-300 shadow-lg backdrop-blur-md">
          <img
            src={tenantFaviconUrl}
            alt={`${listing.tenant_name || listing.tenant_domain} corporate mark`}
            className="size-4 rounded-full bg-white/10 p-0.5 object-contain"
            onError={() => setLogoFailed(true)}
          />
          <span className="truncate max-w-[160px] text-[11px]">
            {listing.tenant_name || listing.tenant_domain}
          </span>
          <ShieldCheck className="size-3 text-emerald-400 shrink-0" />
        </div>
      ) : null}

      {/* Geocoded Ground-Truth Verification Tag */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/80 px-2 py-0.5 text-[10px] text-white/90 shadow backdrop-blur-md">
        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono">{formattedCoords || `${listing.city}, ${listing.state}`}</span>
      </div>

      {/* Cadastral GIS Parcel Boundary Indicator when viewing Satellite */}
      {currentView === "satellite" ? (
        <div className="absolute left-3 bottom-12 z-10 flex items-center gap-1.5 rounded-md border border-emerald-500/50 bg-emerald-950/85 px-2 py-0.5 text-[10px] font-mono text-emerald-300 backdrop-blur-md shadow-md">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold uppercase tracking-wider">GIS Parcel Boundary Active</span>
          {listing.parcel_id ? <span className="text-emerald-400/80">• APN: {listing.parcel_id}</span> : null}
          {listing.lot_size_acres ? <span className="text-emerald-400/80">• {listing.lot_size_acres} AC</span> : null}
        </div>
      ) : null}

      {/* Interactive Mode Switcher Tabs (Street View | Satellite | Blueprint) */}
      {interactive ? (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-lg border border-white/15 bg-black/85 p-1 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveView("streetview");
            }}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-colors",
              currentView === "streetview"
                ? "bg-emerald-500 text-black font-bold shadow"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
            title="Ground-level physical facility & facade"
          >
            <Camera className="size-3" />
            <span className="hidden sm:inline">Street View</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveView("satellite");
            }}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-colors",
              currentView === "satellite"
                ? "bg-emerald-500 text-black font-bold shadow"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
            title="Aerial roof & yard parcel footprint"
          >
            <Satellite className="size-3" />
            <span className="hidden sm:inline">Satellite</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveView("blueprint");
            }}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-colors",
              currentView === "blueprint"
                ? "bg-emerald-500 text-black font-bold shadow"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
            title="Institutional architectural blueprint schematic"
          >
            <Layers className="size-3" />
            <span className="hidden sm:inline">Blueprint</span>
          </button>
        </div>
      ) : null}

      {/* Bottom Status / Mode Label */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 text-[10px] text-emerald-400/90 font-mono">
        <ShieldCheck className="size-3 text-emerald-400" />
        <span className="hidden sm:inline uppercase tracking-wider text-[9px] font-bold">
          {currentView === "streetview"
            ? "Street Ground Truth"
            : currentView === "satellite"
              ? "Aerial Footprint"
              : "CAD Vector Blueprint"}
        </span>
      </div>
    </div>
  );
}
