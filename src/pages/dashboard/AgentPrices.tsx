import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { labelFor } from "@/components/data/BuyDataDialog";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Badge } from "@/components/ui/badge";
import { groupByNetwork, sortByNetworkThenSize } from "@/lib/networks";
import { Link } from "react-router-dom";
import { useDashboardRole } from "@/hooks/useDashboardRole";

function buyPath(network: string) {
  if (network.startsWith("airteltigo")) return "/dashboard/buy-data/airteltigo";
  if (network === "telecel") return "/dashboard/buy-data/telecel";
  return "/dashboard/buy-data/mtn";
}

type SubPriceRow = {
  data_package_id: string;
  network: string;
  size_gb: number;
  agent_base_price: number;
  subagent_price: number;
  validity: string;
};

export default function AgentPrices() {
  const { isSubAgent, isParentAgent } = useDashboardRole();
  const [packages, setPackages] = useState<any[]>([]);
  const [subPrices, setSubPrices] = useState<SubPriceRow[]>([]);

  useEffect(() => {
    (async () => {
      if (isSubAgent) {
        const { data } = await supabase.rpc("get_my_subagent_prices");
        setSubPrices((data as SubPriceRow[]) ?? []);
        setPackages([]);
      } else {
        const { data } = await supabase.from("data_packages").select("*").eq("active", true);
        setPackages(sortByNetworkThenSize(data ?? []));
        setSubPrices([]);
      }
    })();
  }, [isSubAgent]);

  const grouped = isSubAgent
    ? groupByNetwork(subPrices.map(r => ({ ...r, id: r.data_package_id })))
    : groupByNetwork(packages);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={isSubAgent ? "My Prices" : "Agent Prices"}
        description={
          isSubAgent
            ? "Wholesale prices set by your parent agent. You buy data at these rates."
            : "Wholesale agent base prices vs public user prices. You buy at agent rates."
        }
        badge={isSubAgent ? "Sub-agent" : "Agent"}
      />

      {grouped.map(g => (
        <GlassCard key={g.network} title={g.label}>
          <ul className="divide-y divide-white/10">
            {g.items.map(p => (
              <li key={p.id ?? p.data_package_id} className="py-3 flex justify-between items-center gap-4">
                <div>
                  <span className="font-bold">{p.size_gb}GB</span>
                  <span className="text-xs text-muted-foreground ml-2">{p.validity}</span>
                </div>
                <div className="text-right">
                  {isSubAgent ? (
                    <>
                      <p className="font-black text-primary">
                        ₵{Number(p.subagent_price).toFixed(2)}{" "}
                        <Badge variant="outline" className="text-[9px] ml-1">Your rate</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Agent base: ₵{Number(p.agent_base_price).toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-black text-primary">
                        ₵{Number(p.agent_price).toFixed(2)}{" "}
                        <Badge variant="outline" className="text-[9px] ml-1">Agent</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">User: ₵{Number(p.user_price).toFixed(2)}</p>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Link to={buyPath(g.network)} className="inline-block mt-4 text-sm font-bold text-primary hover:underline">
            Buy {labelFor(g.network)} →
          </Link>
        </GlassCard>
      ))}

      {isParentAgent && (
        <p className="text-sm text-muted-foreground">
          Set custom wholesale rates for your sub-agents on the{" "}
          <Link to="/dashboard/subagent-pricing" className="text-primary font-semibold hover:underline">
            Sub-agent Pricing
          </Link>{" "}
          page.
        </p>
      )}
    </div>
  );
}
