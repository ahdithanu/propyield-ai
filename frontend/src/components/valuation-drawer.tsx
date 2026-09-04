import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ValuationPanel, type ValuationForm } from "@/components/valuation-panel";

export function ValuationDrawer({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ValuationForm | undefined;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="ml-auto h-full w-full max-w-3xl border-l border-emerald/15 bg-surface/95 backdrop-blur-xl">
        <DrawerHeader className="text-left">
          <DrawerTitle>ML Valuation Calculator</DrawerTitle>
          <DrawerDescription>
            Model fair market value, confidence, and undervaluation score for any CRE asset.
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8">
          <ValuationPanel initial={initial} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
