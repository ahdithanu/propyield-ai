import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";
import { ValuationPanel } from "@/components/valuation-panel";

export const Route = createFileRoute("/valuation")({
  head: () => ({
    meta: [
      { title: "ML Valuation Calculator — PropYield AI" },
      {
        name: "description",
        content:
          "Model fair market value, price per sqft, confidence, and undervaluation deal score for any commercial real estate asset.",
      },
      { property: "og:title", content: "ML Valuation Calculator — PropYield AI" },
      {
        property: "og:description",
        content:
          "Enter property type, sqft, market, cap rate, and asking price to get an ML fair-value estimate and investment recommendation.",
      },
    ],
  }),
  component: ValuationPage,
});

function ValuationPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 lg:px-8">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">ML Valuation Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Underwrite any asset against the trained valuation ensemble and comparable vector neighborhood.
          </p>
        </section>
        <div className="glass rounded-2xl p-5 lg:p-6">
          <ValuationPanel />
        </div>
      </main>
    </div>
  );
}
