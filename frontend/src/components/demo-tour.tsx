import { useState } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileSpreadsheet,
  Network,
  Play,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DemoTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectStepAction?: (stepIndex: number) => void;
}

const STEPS = [
  {
    step: 1,
    title: "AI Natural Language Vector Deal Screener",
    badge: "Vector Search",
    icon: Sparkles,
    pitch: "How VP / Partners screen 10x faster",
    description:
      "Instead of forcing brokers to click 15 filter checkboxes, PropYield AI embeds listing descriptions and financial terms into a TF-IDF vector space. Type prompts like 'high cap rate NNN retail with low price per sqft in Texas' to instantly retrieve semantic matches.",
    actionText: "Try Vector Query: 'high cap rate retail near highway'",
    searchQuery: "high cap rate retail near highway",
    valueProps: [
      "No rigid SQL filters needed — accepts natural broker queries",
      "Matches location, tenant profile, and cap rate semantics",
      "Ranks listings by contextual relevance score",
    ],
  },
  {
    step: 2,
    title: "Machine Learning Undervaluation & Arbitrage Engine",
    badge: "ML Valuation Model",
    icon: Brain,
    pitch: "Instant baseline underwriting & deal discovery",
    description:
      "Our Random Forest ML model predicts fair market valuation across submarket comps in real-time. Assets asking 10%+ below modeled fair market value automatically receive high Undervaluation Deal Scores (80+/100).",
    actionText: "Filter for Top Undervalued Deals",
    searchQuery: "",
    valueProps: [
      "Replaces days of manual Excel comp pulling in seconds",
      "Quantifies undervaluation arbitrage percentage",
      "Highlights mispriced NNN & multi-family assets immediately",
    ],
  },
  {
    step: 3,
    title: "Submarket Graph Centrality & PageRank Topology",
    badge: "NetworkX Knowledge Graph",
    icon: Network,
    pitch: "Capital allocation & trend forecasting",
    description:
      "Real estate markets behave as economic graphs. PropYield AI builds property–tenant–submarket knowledge graphs, computing PageRank centrality scores to identify high-density commercial hubs before cap rate compression occurs.",
    actionText: "Explore Market Hub Graph Topology",
    searchQuery: "",
    valueProps: [
      "Calculates PageRank score across economic nodes",
      "Measures multi-hop neighborhood density and cross-market links",
      "Directs acquisition capital to top-ranked submarket hubs",
    ],
  },
  {
    step: 4,
    title: "Dynamic Sensitivity & Scenario Underwriting",
    badge: "Underwriting Sandbox",
    icon: FileSpreadsheet,
    pitch: "Interactive deal testing for Investment Committee",
    description:
      "Underwrite any property with instant sensitivity testing. Adjust building sqft, asking cap rate, or rent growth inputs to calculate modeled price/sqft, fair market value, and buy/pass recommendations on the fly.",
    actionText: "Open Underwriting Sandbox",
    searchQuery: "",
    valueProps: [
      "Instant scenario analysis without broken Excel formulas",
      "Real-time buy/hold/pass executive recommendations",
      "Confidence-weighted valuation scoring",
    ],
  },
  {
    step: 5,
    title: "Executive IC Memo & One-Click Deal Teaser Export",
    badge: "Partner Action Hub",
    icon: Target,
    pitch: "Closing the deal & Partner sign-off",
    description:
      "When a partner finds an actionable deal, PropYield AI generates a formal Investment Committee (IC) Deal Memo formatted for immediate PDF export or print review, complete with ML comps, graph metrics, and signature blocks.",
    actionText: "Generate IC Deal Memo",
    searchQuery: "",
    valueProps: [
      "Saves acquisitions team 5+ hours per IC package",
      "Standardizes partner review across regional offices",
      "Export directly to PDF or print for partner meetings",
    ],
  },
];

export function DemoTourModal({ open, onOpenChange, onSelectStepAction }: DemoTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const activeStep = STEPS[currentStep]!;
  const IconComponent = activeStep.icon;

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAction = () => {
    if (onSelectStepAction) {
      onSelectStepAction(currentStep);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge className="border-emerald/30 bg-emerald-soft text-emerald gap-1.5 py-1">
              <Compass className="size-3.5" /> PropYield AI — Executive Demo Walkthrough
            </Badge>
            <span className="num text-xs font-semibold text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold mt-3 flex items-center gap-2">
            <IconComponent className="size-5 text-emerald" />
            {activeStep.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-emerald font-medium">
            {activeStep.pitch}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator Bar */}
        <div className="flex items-center gap-1.5 py-1">
          {STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                idx === currentStep
                  ? "bg-emerald"
                  : idx < currentStep
                    ? "bg-emerald/50"
                    : "bg-surface-2"
              }`}
              title={`Step ${s.step}: ${s.title}`}
            />
          ))}
        </div>

        {/* Content Body */}
        <div className="space-y-4 py-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {activeStep.description}
          </p>

          <div className="rounded-xl border border-border bg-surface-2/60 p-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              VP &amp; Executive Value Drivers:
            </p>
            <ul className="space-y-1.5 text-xs">
              {activeStep.valueProps.map((vp) => (
                <li key={vp} className="flex items-start gap-2 text-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald mt-0.5" />
                  <span>{vp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="size-4" /> Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="gap-1 text-xs" onClick={handleAction}>
              <Play className="size-3.5" /> {activeStep.actionText}
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button size="sm" className="gap-1 font-semibold" onClick={nextStep}>
                Next <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button size="sm" className="gap-1 font-semibold" onClick={() => onOpenChange(false)}>
                Finish Walkthrough <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
