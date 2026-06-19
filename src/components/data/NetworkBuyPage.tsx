import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BuyDataDialog, { labelFor } from "./BuyDataDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBuyPrices } from "@/hooks/useBuyPrices";
import { useDashboardRole } from "@/hooks/useDashboardRole";
import AgentUpgradeBanner from "@/components/dashboard/AgentUpgradeBanner";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

type Network = "mtn" | "airteltigo_ishare" | "airteltigo_bigtime" | "telecel";

const styles: Record<Network, string> = {
  mtn: "bg-mtn text-mtn-foreground hover:shadow-[0_0_24px_hsl(var(--mtn)/0.5)]",
  airteltigo_ishare: "bg-airteltigo text-airteltigo-foreground hover:shadow-[0_0_24px_hsl(var(--airteltigo)/0.5)]",
  airteltigo_bigtime: "bg-airteltigo text-airteltigo-foreground hover:shadow-[0_0_24px_hsl(var(--airteltigo)/0.5)]",
  telecel: "bg-telecel text-telecel-foreground hover:shadow-[0_0_24px_hsl(var(--telecel)/0.5)]",
};

export default function NetworkBuyPage({ network, title, subtitle, embedded }: { network: Network; title: string; subtitle: string; embedded?: boolean }) {
  const { isSubAgent, isParentAgent, loading: roleLoading } = useDashboardRole();
  const { resolvePrice, loading: priceLoading } = useBuyPrices();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("data_packages").select("*").eq("network", network).eq("active", true).order("size_gb");
    setPackages(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [network]);

  const displayPackages = packages.map(p => ({ ...p, price: resolvePrice(p) }));
  const pricingLabel = isSubAgent ? "Sub-agent pricing" : isParentAgent ? "Agent pricing" : "User pricing";

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <Link to="/dashboard/buy-data" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary font-semibold mb-3">
            <ChevronLeft className="h-4 w-4" /> Back to Buy Data
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-display font-bold">{title}</h1>
            {!roleLoading && (
              <Badge variant={isSubAgent || isParentAgent ? "default" : "secondary"}>
                {pricingLabel}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
          {isSubAgent && (
            <p className="text-xs text-primary mt-1">Prices set by your parent agent.</p>
          )}
          {isParentAgent && (
            <p className="text-xs text-primary mt-1">You have a store — you're buying at agent rates.</p>
          )}
          {!isSubAgent && !isParentAgent && !roleLoading && (
            <p className="text-xs text-amber-400 mt-1">
              Paying user prices?{" "}
              <Link to="/dashboard/my-store" className="font-bold underline hover:text-amber-300">
                Become an agent
              </Link>{" "}
              for cheaper bundles.
            </p>
          )}
        </div>
      )}

      {!embedded && !isSubAgent && !isParentAgent && !roleLoading && (
        <AgentUpgradeBanner />
      )}

      {loading || roleLoading || priceLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : displayPackages.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No {labelFor(network)} packages available yet.</Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayPackages.map(p => (
            <button key={p.id} onClick={() => { setSelected(p); setOpen(true); }}
              className={`text-left rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 ${styles[network]}`}>
              <div className="text-3xl md:text-4xl font-display font-black">{p.size_gb}<span className="text-lg ml-1">GB</span></div>
              <div className="mt-3 text-sm opacity-80">{p.validity}</div>
              <div className="mt-1 text-xl font-bold">₵{Number(p.price).toFixed(2)}</div>
            </button>
          ))}
        </div>
      )}

      <BuyDataDialog pkg={selected} open={open} onOpenChange={setOpen} onSuccess={load} />
    </div>
  );
}
