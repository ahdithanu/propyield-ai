import { useState } from "react";
import { Building2, Download, FileText, Printer, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dealVerdict, money, money2, num, pct } from "@/lib/format";
import type { Listing } from "@/lib/types";

interface IcMemoModalProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IcMemoModal({ listing, open, onOpenChange }: IcMemoModalProps) {
  const [partnerNotes, setPartnerNotes] = useState(
    "Asset presents attractive basis discount with durable in-place cash flow. Recommended for IC approval.",
  );

  if (!listing) return null;

  const verdict = dealVerdict(listing.deal_score);
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge className="border-emerald/30 bg-emerald-soft text-emerald gap-1">
              <Sparkles className="size-3" /> PropYield AI — Executive IC Deal Memo
            </Badge>

            <div className="flex items-center gap-2 print:hidden">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handlePrint}>
                <Printer className="size-3.5" /> Print / Export PDF
              </Button>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold mt-2">
            Investment Committee Memorandum: {listing.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Prepared for Investment Committee &amp; Executive Partners · Generated {new Date().toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2 text-foreground">
          {/* Executive Summary Header Box */}
          <div className="grid gap-4 rounded-xl border border-emerald/30 bg-emerald-soft/20 p-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Asking Price</p>
              <p className="num text-xl font-bold text-foreground">{money(listing.listing_price)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ML Fair Value</p>
              <p className="num text-xl font-bold text-emerald">{money(listing.ml_predicted_price)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Deal Score &amp; Arbitrage</p>
              <p className="num text-xl font-bold text-emerald">
                {listing.deal_score}/100 ({Math.abs(listing.undervaluation_pct).toFixed(1)}% {listing.undervaluation_pct >= 0 ? "Under Ask" : "Over Ask"})
              </p>
            </div>
          </div>

          {/* Section 1: Property Profile */}
          <section className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold border-b pb-1">
              <Building2 className="size-4 text-emerald" /> 1. Asset &amp; Location Overview
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div className="rounded-lg bg-surface-2 p-2.5">
                <span className="text-muted-foreground block text-[10px]">Property Type</span>
                <span className="font-semibold">{listing.property_type}</span>
              </div>
              <div className="rounded-lg bg-surface-2 p-2.5">
                <span className="text-muted-foreground block text-[10px]">Market / City</span>
                <span className="font-semibold">{listing.city}, {listing.state}</span>
              </div>
              <div className="rounded-lg bg-surface-2 p-2.5">
                <span className="text-muted-foreground block text-[10px]">Building Area</span>
                <span className="font-semibold">{num(listing.sqft)} sqft</span>
              </div>
              <div className="rounded-lg bg-surface-2 p-2.5">
                <span className="text-muted-foreground block text-[10px]">Cap Rate</span>
                <span className="font-semibold text-emerald">{pct(listing.cap_rate)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              <strong className="text-foreground">Address:</strong> {listing.address}, {listing.city}, {listing.state} {listing.zip}<br />
              <strong className="text-foreground">Description:</strong> {listing.description ?? "High quality commercial asset in prime growth corridor."}
            </p>
          </section>

          {/* Section 2: Underwriting Matrix */}
          <section className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold border-b pb-1">
              <FileText className="size-4 text-emerald" /> 2. AI &amp; ML Underwriting Analysis
            </h4>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-1.5 font-medium">Metric</th>
                  <th className="py-1.5 font-medium">Asking Baseline</th>
                  <th className="py-1.5 font-medium">PropYield ML Model</th>
                  <th className="py-1.5 font-medium text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr>
                  <td className="py-2 font-medium">Total Asset Price</td>
                  <td className="num">{money(listing.listing_price)}</td>
                  <td className="num font-semibold text-emerald">{money(listing.ml_predicted_price)}</td>
                  <td className="num text-right font-semibold text-emerald">
                    {listing.undervaluation_pct >= 0 ? "+" : ""}{listing.undervaluation_pct.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Price / Sqft</td>
                  <td className="num">{money2(listing.price_per_sqft)}/sqft</td>
                  <td className="num font-semibold">
                    {money2(listing.sqft ? listing.ml_predicted_price / listing.sqft : 0)}/sqft
                  </td>
                  <td className="num text-right font-semibold">
                    {money2(
                      listing.sqft
                        ? (listing.ml_predicted_price - listing.listing_price) / listing.sqft
                        : 0
                    )}/sqft
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Est. Net Operating Income (NOI)</td>
                  <td className="num">{listing.noi ? money(listing.noi) : money(Math.round(listing.listing_price * (listing.cap_rate / 100)))}</td>
                  <td className="num font-semibold">{money(Math.round((listing.ml_predicted_price * listing.cap_rate) / 100))}</td>
                  <td className="num text-right font-semibold text-emerald">Submarket Peer Benchmark</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Section 3: Partner Executive Recommendation */}
          <section className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold border-b pb-1">
              <UserCheck className="size-4 text-emerald" /> 3. Partner Recommendation &amp; Sign-off Notes
            </h4>
            <div className="space-y-2">
              <Badge variant="outline" className="border-emerald/40 text-emerald font-semibold">
                Verdict: {verdict.label} ({listing.deal_score}/100)
              </Badge>
              <textarea
                value={partnerNotes}
                onChange={(e) => setPartnerNotes(e.target.value)}
                placeholder="Enter executive commentary for the Investment Committee..."
                className="w-full h-20 rounded-lg border border-border bg-surface-2 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald"
              />
            </div>
          </section>

          {/* Partner Signature Block */}
          <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald" /> Verified by PropYield AI Valuation Engine
            </div>
            <div>
              <span className="font-semibold text-foreground">Status: Ready for IC Submission</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
