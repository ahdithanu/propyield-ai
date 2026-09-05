import { Link } from "@tanstack/react-router";
import { Calculator } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dealVerdict, money, money2, num, pct } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PropertyTable({
  listings,
  onAnalyze,
}: {
  listings: Listing[];
  onAnalyze: (listing: Listing) => void;
}) {
  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Property</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Market</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Cap Rate</TableHead>
            <TableHead className="text-right">Sqft</TableHead>
            <TableHead className="text-right">$ / Sqft</TableHead>
            <TableHead className="text-right">Deal Score</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((l) => {
            const verdict = dealVerdict(l.deal_score);
            return (
              <TableRow key={l.id} className="border-border/60">
                <TableCell className="max-w-[260px]">
                  <Link
                    to="/properties/$id"
                    params={{ id: l.id }}
                    className="text-sm font-medium hover:text-emerald"
                  >
                    {l.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{l.address}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {l.property_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {l.city}, {l.state}
                </TableCell>
                <TableCell className="num text-right text-sm">{money(l.listing_price)}</TableCell>
                <TableCell className="num text-right text-sm text-emerald">{pct(l.cap_rate)}</TableCell>
                <TableCell className="num text-right text-sm">{num(l.sqft)}</TableCell>
                <TableCell className="num text-right text-sm">{money2(l.price_per_sqft)}</TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "num rounded-full px-2 py-1 text-xs font-semibold",
                      verdict.tone === "emerald"
                        ? "bg-emerald-soft text-emerald"
                        : verdict.tone === "warn"
                          ? "text-warn"
                          : "text-muted-foreground",
                    )}
                  >
                    {l.deal_score} · {verdict.label}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onAnalyze(l)}>
                      <Calculator className="size-3.5" /> Analyze
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link to="/properties/$id" params={{ id: l.id }}>
                        View Detail
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
