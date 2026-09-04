/** Compact currency formatted manually: Intl compact notation differs between
 * the SSR runtime's ICU build and browsers, which causes hydration mismatches. */
function compactCurrency(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const trim = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  if (abs >= 1_000_000_000) return `${sign}$${trim(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}$${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}$${trim(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

export function money(value: number, opts: { compact?: boolean } = {}) {
  if (!Number.isFinite(value)) return "—";
  if (opts.compact) return compactCurrency(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function money2(value: number) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function pct(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function signedPct(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function num(value: number) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function dealVerdict(score: number) {
  if (score >= 80) return { label: "STRONG BUY", tone: "emerald" as const };
  if (score >= 65) return { label: "BUY", tone: "emerald" as const };
  if (score >= 45) return { label: "HOLD", tone: "warn" as const };
  return { label: "PASS", tone: "muted" as const };
}
