import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardRole } from "@/hooks/useDashboardRole";
import type { DataPackage } from "@/lib/pricing";

/** Maps catalog packages to the price the current user pays (user / agent / sub-agent). */
export function useBuyPrices() {
  const { user } = useAuth();
  const { isSubAgent, isAgent } = useDashboardRole();
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPriceMap({}); setLoading(false); return; }

    (async () => {
      setLoading(true);
      if (isSubAgent) {
        const { data } = await supabase.rpc("get_my_subagent_prices");
        const map: Record<string, number> = {};
        for (const row of data ?? []) {
          map[row.data_package_id] = Number(row.subagent_price);
        }
        setPriceMap(map);
      } else {
        const { data } = await supabase.from("data_packages").select("id, user_price, agent_price").eq("active", true);
        const map: Record<string, number> = {};
        for (const p of data ?? []) {
          map[p.id] = Number(isAgent ? p.agent_price : p.user_price);
        }
        setPriceMap(map);
      }
      setLoading(false);
    })();
  }, [user, isSubAgent, isAgent]);

  const resolvePrice = (pkg: DataPackage | { id: string; user_price: number; agent_price: number }) => {
    if (priceMap[pkg.id] != null) return priceMap[pkg.id];
    return Number(isAgent || isSubAgent ? pkg.agent_price : pkg.user_price);
  };

  return { priceMap, resolvePrice, loading, isSubAgent, isAgent };
}
