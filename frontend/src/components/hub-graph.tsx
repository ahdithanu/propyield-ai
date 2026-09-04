import type { MarketHub } from "@/lib/types";

/** Radial multi-hop neighborhood visualizer rendered as inline SVG. */
export function HubGraph({ hub, maxHop }: { hub: MarketHub; maxHop: number }) {
  const visible = hub.neighbors.filter((n) => n.hop <= maxHop);
  const size = 360;
  const c = size / 2;
  const radiusFor = (hop: number) => 50 + hop * 48;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-[320px] w-full max-w-[420px]">
      {[1, 2, 3].map((hop) =>
        hop <= maxHop ? (
          <circle
            key={hop}
            cx={c}
            cy={c}
            r={radiusFor(hop)}
            fill="none"
            stroke="var(--border)"
            strokeDasharray="3 5"
          />
        ) : null,
      )}

      {visible.map((n, i) => {
        const angle = (i / Math.max(visible.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const r = radiusFor(n.hop);
        const x = c + Math.cos(angle) * r;
        const y = c + Math.sin(angle) * r;
        return (
          <g key={n.name}>
            <line
              x1={c}
              y1={c}
              x2={x}
              y2={y}
              stroke="var(--emerald)"
              strokeOpacity={0.15 + n.weight * 0.5}
              strokeWidth={1 + n.weight * 2}
            />
            <circle cx={x} cy={y} r={6 + n.weight * 5} fill="var(--emerald)" fillOpacity={0.25 + n.weight * 0.5} />
            <text
              x={x}
              y={y - 13 - n.weight * 4}
              textAnchor="middle"
              fill="var(--foreground)"
              fontSize="9"
              opacity="0.85"
            >
              {n.name}
            </text>
          </g>
        );
      })}

      <circle cx={c} cy={c} r="26" fill="var(--emerald)" fillOpacity="0.16" stroke="var(--emerald)" />
      <text x={c} y={c + 3} textAnchor="middle" fill="var(--emerald)" fontSize="10" fontWeight="600">
        {hub.city || "HUB"}
      </text>
    </svg>
  );
}
