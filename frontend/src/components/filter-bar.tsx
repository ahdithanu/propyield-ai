import { RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { money } from "@/lib/format";
import { STATES } from "@/lib/types";

export interface FilterDraft {
  state: string;
  city: string;
  priceRange: [number, number];
  capRange: [number, number];
  minSqft: string;
  maxSqft: string;
}

export const DEFAULT_DRAFT: FilterDraft = {
  state: "ALL",
  city: "",
  priceRange: [500_000, 25_000_000],
  capRange: [4, 12],
  minSqft: "",
  maxSqft: "",
};

export function FilterBar({
  draft,
  onChange,
  onRun,
  onReset,
  running,
}: {
  draft: FilterDraft;
  onChange: (next: FilterDraft) => void;
  onRun: () => void;
  onReset: () => void;
  running: boolean;
}) {
  const set = <K extends keyof FilterDraft>(key: K, value: FilterDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <section className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">AI Semantic Search &amp; Advanced Filters</h2>
          <p className="text-xs text-muted-foreground">
            Vector search over the CRE corpus, refined by hard underwriting constraints.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5 text-muted-foreground">
          <RotateCcw className="size-3.5" /> Reset
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-5">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">State</Label>
          <Select value={draft.state} onValueChange={(v) => set("state", v)}>
            <SelectTrigger className="w-full bg-surface/70">
              <SelectValue placeholder="All states" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All states</SelectItem>
              {STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground" htmlFor="city">
            City
          </Label>
          <Input
            id="city"
            value={draft.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Austin, Miami, Dallas..."
            className="bg-surface/70"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Price Range</Label>
            <span className="num text-xs text-emerald">
              {money(draft.priceRange[0], { compact: true })} – {money(draft.priceRange[1], { compact: true })}
            </span>
          </div>
          <Slider
            value={draft.priceRange}
            min={500_000}
            max={25_000_000}
            step={250_000}
            onValueChange={(v) => set("priceRange", [v[0]!, v[1]!])}
            className="pt-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Cap Rate</Label>
            <span className="num text-xs text-emerald">
              {draft.capRange[0].toFixed(1)}% – {draft.capRange[1].toFixed(1)}%
            </span>
          </div>
          <Slider
            value={draft.capRange}
            min={4}
            max={12}
            step={0.1}
            onValueChange={(v) => set("capRange", [v[0]!, v[1]!])}
            className="pt-2"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Sqft Range</Label>
          <div className="flex items-center gap-2">
            <Input
              value={draft.minSqft}
              inputMode="numeric"
              onChange={(e) => set("minSqft", e.target.value.replace(/\D/g, ""))}
              placeholder="Min"
              className="bg-surface/70"
              aria-label="Minimum square feet"
            />
            <Input
              value={draft.maxSqft}
              inputMode="numeric"
              onChange={(e) => set("maxSqft", e.target.value.replace(/\D/g, ""))}
              placeholder="Max"
              className="bg-surface/70"
              aria-label="Maximum square feet"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={onRun} disabled={running} className="gap-2 font-semibold">
          <Sparkles className="size-4" />
          {running ? "Running AI Search..." : "Run AI Search"}
        </Button>
      </div>
    </section>
  );
}
