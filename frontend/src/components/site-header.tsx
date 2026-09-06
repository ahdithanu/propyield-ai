import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Activity, Calculator, Compass, LayoutDashboard, Menu, Network, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PROPERTY_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/valuation", label: "ML Valuation", icon: Calculator },
  { to: "/market-hubs", label: "Market Hubs", icon: Network },
] as const;

export function Brand({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="glow-emerald relative flex size-9 items-center justify-center rounded-xl bg-emerald-soft">
        <TrendingUp className="size-5 text-emerald" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">PropYield AI</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          CRE Intelligence
        </span>
      </span>
    </Link>
  );
}

export function LiveBadge() {
  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-emerald/30 bg-emerald-soft py-1 text-emerald"
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-emerald" />
      </span>
      Live Pipeline: Connected
    </Badge>
  );
}

export function SiteHeader({ onOpenDemo }: { onOpenDemo?: () => void }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { q?: string; type?: string };
  const [term, setTerm] = useState(search.q ?? "");
  const [open, setOpen] = useState(false);
  const activeType = search.type ?? "All";

  useEffect(() => setTerm(search.q ?? ""), [search.q]);

  const submit = (overrideTerm?: string) => {
    const qVal = overrideTerm !== undefined ? overrideTerm : term;
    navigate({ to: "/", search: (prev) => ({ ...(prev as object), q: qVal, page: 1 }) as never });
  };

  const clear = () => {
    setTerm("");
    submit("");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 lg:px-8">
        <div className="flex items-center gap-4">
          <Brand />

          <div className="relative ml-auto hidden max-w-2xl flex-1 items-center lg:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              aria-label="AI property search"
              placeholder="Search properties using AI (e.g. 'high cap rate triple net retail in Texas')..."
              className="h-10 bg-surface/70 pl-9 pr-20 text-sm placeholder:text-muted-foreground/70"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {term ? (
                <button onClick={clear} className="p-1 text-muted-foreground hover:text-foreground" title="Clear search">
                  <X className="size-3.5" />
                </button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => submit()} className="h-7 px-2 text-xs font-semibold text-emerald hover:bg-emerald-soft">
                Search
              </Button>
            </div>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "bg-emerald-soft text-emerald hover:text-emerald" }}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>

          {onOpenDemo ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenDemo}
              className="gap-1.5 border-emerald/40 text-emerald hover:bg-emerald-soft font-semibold"
            >
              <Compass className="size-4 text-emerald" /> Interactive Demo
            </Button>
          ) : null}

          <div className="ml-auto hidden xl:block">
            <LiveBadge />
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="ml-auto lg:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-surface p-6">
              <SheetTitle className="mb-6 text-left">Navigation</SheetTitle>
              <div className="flex flex-col gap-1">
                {NAV.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    activeOptions={{ exact: to === "/" }}
                    activeProps={{ className: "bg-emerald-soft text-emerald" }}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="size-3.5 text-emerald" /> Live Pipeline: Connected
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <div className="relative flex flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              aria-label="AI property search"
              placeholder="Search properties using AI..."
              className="h-10 bg-surface/70 pl-9 pr-16 text-sm"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {term ? (
                <button onClick={clear} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => submit()} className="h-7 px-2 text-xs text-emerald">
                Go
              </Button>
            </div>
          </div>
        </div>

        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-0.5">
          {PROPERTY_TYPES.map((t) => (
            <Link
              key={t}
              to="/"
              search={(prev) => ({ ...(prev as object), type: t }) as never}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeType === t
                  ? "border-emerald/40 bg-emerald-soft text-emerald"
                  : "border-border bg-surface/60 text-muted-foreground hover:border-emerald/25 hover:text-foreground",
              )}
            >
              {t}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
