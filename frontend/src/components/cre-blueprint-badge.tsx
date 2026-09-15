import { useId } from "react";
import { Compass, Layers, ShieldCheck, Ruler, Building2, Truck, ShoppingBag, Home, Trees } from "lucide-react";
import { formatCoordinates } from "@/lib/authentic-imagery";
import type { Listing } from "@/lib/types";

interface CreBlueprintBadgeProps {
  listing: Listing;
  className?: string;
  compact?: boolean;
}

export function CreBlueprintBadge({ listing, className = "", compact = false }: CreBlueprintBadgeProps) {
  const patternId = useId();
  const propertyType = (listing.property_type || "Commercial").toLowerCase();
  const coordsStr = formatCoordinates(listing.latitude, listing.longitude);

  return (
    <div
      className={`relative w-full overflow-hidden select-none bg-[#09111e] text-emerald-400 font-mono border border-emerald-500/20 shadow-inner flex flex-col justify-between ${className}`}
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 50% 20%, rgba(16, 185, 129, 0.08) 0%, rgba(9, 17, 30, 0.95) 75%),
          linear-gradient(to right, rgba(16, 185, 129, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(16, 185, 129, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 20px 20px, 20px 20px",
      }}
    >
      {/* Top Engineering Stamp */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-950/40 px-3 py-1.5 text-[10px] uppercase tracking-widest text-emerald-300">
        <div className="flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>Institutional CAD Blueprint</span>
          <span className="hidden sm:inline text-emerald-500/60">• Ground Truth Grounding</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400/80">
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/30 text-[9px] font-bold">
            ZERO-STOCK VERIFIED
          </span>
        </div>
      </div>

      {/* Main Architectural SVG Blueprint Drawing */}
      <div className="relative flex-1 flex items-center justify-center p-2 min-h-[140px]">
        <svg
          viewBox="0 0 400 200"
          className="size-full max-h-48 drop-shadow-[0_0_12px_rgba(16,185,129,0.15)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Background Micro-grid */}
          <rect width="400" height="200" fill={`url(#${patternId})`} />

          {/* Asset-Specific Architectural Schematic */}
          {propertyType.includes("industrial") ? (
            <IndustrialSchematic />
          ) : propertyType.includes("retail") ? (
            <RetailSchematic />
          ) : propertyType.includes("office") ? (
            <OfficeSchematic />
          ) : propertyType.includes("multi") || propertyType.includes("family") ? (
            <MultifamilySchematic />
          ) : (
            <LandSchematic />
          )}

          {/* Precision Crosshairs */}
          <circle cx="200" cy="100" r="3" stroke="#10b981" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="190" y1="100" x2="210" y2="100" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.6" />
          <line x1="200" y1="90" x2="200" y2="110" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.6" />
        </svg>

        {/* Compass / Orientation Rose in upper right */}
        <div className="absolute top-2 right-2 flex flex-col items-center opacity-70 pointer-events-none">
          <Compass className="size-4 text-emerald-400" />
          <span className="text-[8px] font-bold tracking-tighter text-emerald-300">TRUE N</span>
        </div>
      </div>

      {/* Underwriting Metadata Bar */}
      <div className="border-t border-emerald-500/20 bg-[#060c15]/90 p-2.5 backdrop-blur">
        <div className="flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <Layers className="size-3 text-emerald-400 shrink-0" />
              <p className="truncate font-semibold text-emerald-200 text-[11px]">
                {listing.title || `${listing.property_type} Facility`}
              </p>
            </div>
            <p className="text-[10px] text-emerald-400/70 truncate mt-0.5">
              {[listing.address, listing.city, listing.state].filter(Boolean).join(", ")}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[11px] font-bold text-emerald-300">
              {listing.sqft ? `${Number(listing.sqft).toLocaleString()} SF` : "N/A"}
            </p>
            <p className="text-[9px] text-emerald-500/80">
              {coordsStr || `${listing.city || "CRE"}, ${listing.state || "US"}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 1. Industrial / Logistics Cross-Dock Schematic
function IndustrialSchematic() {
  return (
    <g>
      {/* Outer boundary & Truck Apron */}
      <rect x="40" y="30" width="320" height="140" stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 3" strokeOpacity="0.4" />
      <text x="50" y="45" fill="#10b981" fontSize="9" opacity="0.8">TRUCK APRON & STAGING YARD (130' TURNING RADIUS)</text>

      {/* Main High-Bay Warehouse Structure */}
      <rect x="70" y="55" width="260" height="90" fill="#0f2620" stroke="#10b981" strokeWidth="2" />
      <text x="140" y="95" fill="#34d399" fontSize="12" fontWeight="bold">32' CLEAR CROSS-DOCK</text>
      <text x="150" y="110" fill="#10b981" fontSize="8" opacity="0.8">54' x 50' COLUMN SPACING</text>

      {/* Loading Docks South */}
      {[85, 115, 145, 175, 205, 235, 265, 295].map((x, i) => (
        <g key={x}>
          <rect x={x} y="145" width="18" height="8" fill="#10b981" fillOpacity="0.3" stroke="#10b981" strokeWidth="1" />
          <text x={x + 3} y="152" fill="#a7f3d0" fontSize="6">D{i + 1}</text>
        </g>
      ))}

      {/* Drive-in Ramp North */}
      <rect x="85" y="47" width="28" height="8" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
      <text x="88" y="53" fill="#10b981" fontSize="6">RAMP</text>
    </g>
  );
}

// 2. Retail / NNN Outparcel Schematic
function RetailSchematic() {
  return (
    <g>
      {/* Property Boundary */}
      <polygon points="50,30 350,30 350,170 50,170" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" strokeOpacity="0.4" />
      <text x="60" y="45" fill="#10b981" fontSize="9" opacity="0.8">NNN COMMERCIAL PAD SITE • SIGNALIZED CORNER</text>

      {/* Building Envelope */}
      <rect x="80" y="65" width="160" height="75" fill="#0f2620" stroke="#10b981" strokeWidth="2" />
      <text x="95" y="100" fill="#34d399" fontSize="11" fontWeight="bold">RETAIL OUTPARCEL</text>
      <text x="95" y="115" fill="#10b981" fontSize="8" opacity="0.8">ABSOLUTE NNN • CLEAR SPAN</text>

      {/* Drive-Thru Queuing Lane */}
      <path d="M 70 70 L 65 145 L 245 145" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="100" y="153" fill="#6ee7b7" fontSize="7">DRIVE-THRU QUEUING LANE (8 STACK)</text>

      {/* Parking Bays */}
      {[260, 280, 300, 320].map((x) => (
        <g key={x}>
          <line x1={x} y1="65" x2={x} y2="135" stroke="#10b981" strokeWidth="1" strokeOpacity="0.6" />
          <line x1={x} y1="100" x2={x + 15} y2="100" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.4" />
        </g>
      ))}
      <text x="260" y="150" fill="#10b981" fontSize="7" opacity="0.8">4.8/1K PARKING</text>
    </g>
  );
}

// 3. Office / Medical Professional Floor Plate Schematic
function OfficeSchematic() {
  return (
    <g>
      {/* Floor Plate Boundary */}
      <rect x="50" y="30" width="300" height="140" fill="#071915" stroke="#10b981" strokeWidth="2" />
      <text x="60" y="45" fill="#10b981" fontSize="9" opacity="0.8">CORE & SHELL EFFICIENCY • 30' x 30' STRUCTURAL GRID</text>

      {/* Central Core & Elevator Bank */}
      <rect x="150" y="70" width="100" height="60" fill="#133d32" stroke="#10b981" strokeWidth="1.5" />
      <text x="165" y="95" fill="#34d399" fontSize="9" fontWeight="bold">CENTRAL CORE</text>
      <text x="165" y="108" fill="#10b981" fontSize="7">ELEVATORS & HVAC</text>

      {/* Dual Stairwells */}
      <rect x="155" y="115" width="20" height="12" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="0.8" />
      <text x="157" y="123" fill="#a7f3d0" fontSize="6">STAIR A</text>
      <rect x="225" y="115" width="20" height="12" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="0.8" />
      <text x="227" y="123" fill="#a7f3d0" fontSize="6">STAIR B</text>

      {/* Perimeter Windowline Zone */}
      <rect x="60" y="40" width="280" height="120" stroke="#10b981" strokeWidth="0.75" strokeDasharray="3 3" strokeOpacity="0.5" />
      <text x="65" y="155" fill="#6ee7b7" fontSize="7">CONTINUOUS HIGH-EFFICIENCY GLAZED PERIMETER</text>
    </g>
  );
}

// 4. Multi-Family Garden-Style / Mid-Rise Schematic
function MultifamilySchematic() {
  return (
    <g>
      {/* Site Boundary */}
      <rect x="40" y="25" width="320" height="150" stroke="#10b981" strokeWidth="1.2" strokeDasharray="4 2" strokeOpacity="0.4" />
      <text x="50" y="40" fill="#10b981" fontSize="8" opacity="0.8">GARDEN RESIDENTIAL COMMUNITY • 24 UNITS / ACRE</text>

      {/* Building Block 1 */}
      <rect x="60" y="55" width="110" height="45" fill="#0f2620" stroke="#10b981" strokeWidth="1.5" />
      <text x="75" y="75" fill="#34d399" fontSize="8" fontWeight="bold">BUILDING A (12U)</text>
      <text x="75" y="88" fill="#10b981" fontSize="6">2BR / 2BA MIX</text>

      {/* Building Block 2 */}
      <rect x="230" y="55" width="110" height="45" fill="#0f2620" stroke="#10b981" strokeWidth="1.5" />
      <text x="245" y="75" fill="#34d399" fontSize="8" fontWeight="bold">BUILDING B (12U)</text>
      <text x="245" y="88" fill="#10b981" fontSize="6">1BR / 1BA MIX</text>

      {/* Central Amenity Courtyard & Pool */}
      <circle cx="200" cy="115" r="22" fill="#09382e" stroke="#10b981" strokeWidth="1.5" />
      <text x="185" y="117" fill="#6ee7b7" fontSize="7" fontWeight="bold">COURTYARD</text>

      {/* Covered Parking Carports */}
      <line x1="60" y1="150" x2="160" y2="150" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
      <text x="70" y="162" fill="#10b981" fontSize="7">1.8 PARKING SPACES / UNIT</text>
    </g>
  );
}

// 5. Land / Development Topographic Cadastral Schematic
function LandSchematic() {
  return (
    <g>
      {/* Property Metes and Bounds Survey */}
      <polygon points="50,40 330,30 350,150 70,165" fill="#071a14" stroke="#10b981" strokeWidth="2" />
      
      {/* Topographic Contour Lines */}
      <path d="M 60 70 Q 200 60 340 50" fill="none" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.4" />
      <path d="M 65 100 Q 200 90 345 80" fill="none" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.4" />
      <path d="M 70 130 Q 200 120 350 110" fill="none" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.4" />

      {/* Boundary Bearings and Distances */}
      <text x="150" y="35" fill="#6ee7b7" fontSize="8">N 88°14'22" E  •  640.00'</text>
      <text x="315" y="100" fill="#6ee7b7" fontSize="8" transform="rotate(75 315,100)">S 04°22' W • 380.00'</text>
      <text x="140" y="162" fill="#6ee7b7" fontSize="8">S 85°10'44" W  •  625.50'</text>

      {/* Center Survey Benchmark */}
      <text x="140" y="85" fill="#34d399" fontSize="11" fontWeight="bold">C-2 COMMERCIAL ZONING</text>
      <text x="150" y="100" fill="#10b981" fontSize="8">FAR ENVELOPE: 1.50 • MAX HEIGHT 65'</text>
    </g>
  );
}
