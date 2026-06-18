import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { labelFor } from "@/components/data/BuyDataDialog";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Badge } from "@/components/ui/badge";
import { groupByNetwork, sortByNetworkThenSize } from "@/lib/networks";
import { Link } from "react-router-dom";

function buyPath(network: string) {
  if (network.startsWith("airteltigo")) return "/dashboard/buy-data/airteltigo";
  if (network === "telecel") return "/dashboard/buy-data/telecel";
  return "/dashboard/buy-data/mtn";
}

export default function AgentPrices() {
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("data_packages").select("*").eq("active", true).then(({ data }) => {
      setPackages(sortByNetworkThenSize(data ?? []));
    });
  }, []);

  const grouped = groupByNetwork(packages);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Agent Prices"
        description="Wholesale agent base prices vs public user prices. You buy at agent rates."
        badge="Agent"
      />

      {grouped.map(g => (
        <GlassCard key={g.network} title={g.label}>
          <ul className="divide-y divide-white/10">
            {g.items.map(p => (
              <li key={p.id} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <span className="font-bold">{p.size_gb}GB</span>
                  <span className="text-xs text-muted-foreground ml-2">{p.validity}</span>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">₵{Number(p.agent_price).toFixed(2)} <Badge variant="outline" className="text-[9px] ml-1">Agent</Badge></p>
                  <p className="text-xs text-muted-foreground">User: ₵{Number(p.user_price).toFixed(2)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to={buyPath(g.network)} className="inline-block mt-4 text-sm font-bold text-primary hover:underline">
            Buy {labelFor(g.network)} →
          </Link>
        </GlassCard>
      ))}
    </div>
  );
}
