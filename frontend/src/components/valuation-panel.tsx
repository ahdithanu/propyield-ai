import { useMutation } from "@tanstack/react-query";
import { BrainCircuit, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { predictPrice } from "@/lib/api";
import { dealVerdict, money, money2, pct } from "@/lib/format";
import { PROPERTY_TYPES, STATES } from "@/lib/types";
import type { Listing, PredictionInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES = PROPERTY_TYPES.filter((t) => t !== "All");

export interface ValuationForm {
  property_type: string;
  sqft: string;
  city: string;
  state: string;
  cap_rate: string;
  listed_price: string;
}

export const EMPTY_FORM: ValuationForm = {
  property_type: "Retail",
  sqft: "14200",
  city: "Austin",
  state: "TX",
  cap_rate: "6.85",
  listed_price: "2750000",
};

export function formFromListing(l: Listing): ValuationForm {
  return {
    property_type: l.property_type,
    sqft: String(l.sqft),
    city: l.city,
    state: l.state,
    cap_rate: String(l.cap_rate),
    listed_price: String(l.listing_price),
  };
}

export function ValuationPanel({ initial }: { initial?: ValuationForm | undefined }) {
  const [form, setForm] = useState<ValuationForm>(initial ?? EMPTY_FORM);

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const mutation = useMutation({
    mutationFn: (input: PredictionInput) => predictPrice(input),
    onSuccess: (res) => {
      if (res.offline) {
        toast.warning("ML service unreachable — showing local heuristic estimate");
      } else {
        toast.success(`Fair value modeled at ${money(res.data.predicted_price)}`);
      }
    },
    onError: () => toast.error("Valuation failed. Check the ML endpoint and retry."),
  });

  const set = <K extends keyof ValuationForm>(k: K, v: ValuationForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const run = () =>
    mutation.mutate({
      property_type: form.property_type,
      sqft: Number(form.sqft) || 0,
      city: form.city,
      state: form.state,
      cap_rate: Number(form.cap_rate) || 0,
      listed_price: Number(form.listed_price) || 0,
    });

  const result = mutation.data?.data;
  const verdict = result ? dealVerdict(result.deal_score) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Property Type</Label>
            <Select value={form.property_type} onValueChange={(v) => set("property_type", v)}>
              <SelectTrigger className="bg-surface/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground" htmlFor="v-sqft">
              Square Feet
            </Label>
            <Input
              id="v-sqft"
              inputMode="numeric"
              value={form.sqft}
              onChange={(e) => set("sqft", e.target.value.replace(/\D/g, ""))}
              className="num bg-surface/70"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground" htmlFor="v-city">
              City
            </Label>
            <Input
              id="v-city"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="bg-surface/70"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">State</Label>
            <Select value={form.state} onValueChange={(v) => set("state", v)}>
              <SelectTrigger className="bg-surface/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground" htmlFor="v-cap">
              Cap Rate (%)
            </Label>
            <Input
              id="v-cap"
              inputMode="decimal"
              value={form.cap_rate}
              onChange={(e) => set("cap_rate", e.target.value.replace(/[^\d.]/g, ""))}
              className="num bg-surface/70"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground" htmlFor="v-price">
              Listed Price ($)
            </Label>
            <Input
              id="v-price"
              inputMode="numeric"
              value={form.listed_price}
              onChange={(e) => set("listed_price", e.target.value.replace(/\D/g, ""))}
              className="num bg-surface/70"
            />
          </div>
        </div>

        <Button onClick={run} disabled={mutation.isPending} className="w-full gap-2 font-semibold">
          <BrainCircuit className="size-4" />
          {mutation.isPending ? "Running model..." : "Run ML Valuation"}
        </Button>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Real-Time ML Output</h3>
          <Badge variant="outline" className="gap-1 border-emerald/30 text-emerald">
            <Sparkles className="size-3" /> Gradient Boosted Ensemble
          </Badge>
        </div>

        {mutation.isPending ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !result ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Enter deal parameters and run the model to see predicted fair market value, confidence, and
            an AI investment recommendation.
          </p>
        ) : (
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Predicted Fair Market Price
              </p>
              <p className="num text-3xl font-semibold text-emerald">{money(result.predicted_price)}</p>
              <p className="num mt-1 text-xs text-muted-foreground">
                {money2(result.predicted_price_per_sqft)} / sqft estimated
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-2/60 p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Confidence</p>
                <p className="num text-lg font-semibold">{result.confidence}%</p>
                <Progress value={result.confidence} className="mt-2 h-1.5" />
              </div>
              <div className="rounded-lg bg-surface-2/60 p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Deal Score</p>
                <p className="num text-lg font-semibold">{result.deal_score}/100</p>
                <Progress value={result.deal_score} className="mt-2 h-1.5" />
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(
                "num w-full justify-center py-1.5 text-xs font-semibold",
                verdict?.tone === "emerald"
                  ? "border-emerald/40 bg-emerald-soft text-emerald"
                  : verdict?.tone === "warn"
                    ? "border-warn/40 text-warn"
                    : "text-muted-foreground",
              )}
            >
              {verdict?.label} — {pct(Math.abs(result.undervaluation_pct), 1)}{" "}
              {result.undervaluation_pct >= 0 ? "below" : "above"} ML market value
            </Badge>

            <div className="rounded-xl border border-emerald/20 bg-emerald-soft p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-emerald">
                AI Investment Recommendation
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{result.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
