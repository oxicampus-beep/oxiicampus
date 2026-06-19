import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { labelFor } from "@/components/data/BuyDataDialog";
import { groupByNetwork, sortByNetworkThenSize } from "@/lib/networks";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useDashboardRole } from "@/hooks/useDashboardRole";

export default function AgentSubAgentPricing() {
  const { canRecruitSubAgents, loading: roleLoading } = useDashboardRole();
  const [packages, setPackages] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: pkgs }, { data: custom }] = await Promise.all([
        supabase.from("data_packages").select("*").eq("active", true),
        supabase.from("agent_subagent_prices").select("data_package_id, price"),
      ]);
      setPackages(sortByNetworkThenSize(pkgs ?? []));
      const map: Record<string, string> = {};
      for (const row of custom ?? []) {
        map[row.data_package_id] = String(row.price);
      }
      setPrices(map);
    })();
  }, []);

  const save = async (packageId: string, agentBase: number) => {
    const val = Number(prices[packageId]);
    if (!val || val < agentBase) {
      return toast.error(`Price must be at least ₵${agentBase.toFixed(2)} (your agent base)`);
    }
    setSaving(packageId);
    const { error } = await supabase.rpc("set_subagent_price", {
      p_data_package_id: packageId,
      p_price: val,
    });
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("Sub-agent price saved");
  };

  if (!roleLoading && !canRecruitSubAgents) {
    return <Navigate to="/dashboard" replace />;
  }

  const grouped = groupByNetwork(packages);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Sub-agent Pricing"
        description="Set what your sub-agents pay for each bundle. Minimum is your agent base price."
        badge="Agent"
      />

      {grouped.map(g => (
        <GlassCard key={g.network} title={g.label}>
          <ul className="divide-y divide-white/10">
            {g.items.map(p => (
              <li key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <span className="font-bold">{p.size_gb}GB</span>
                  <span className="text-xs text-muted-foreground ml-2">Agent base: ₵{Number(p.agent_price).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min={p.agent_price}
                    placeholder={Number(p.agent_price).toFixed(2)}
                    value={prices[p.id] ?? ""}
                    onChange={e => setPrices(prev => ({ ...prev, [p.id]: e.target.value }))}
                    className="w-28 h-9"
                  />
                  <Button
                    size="sm"
                    disabled={saving === p.id}
                    onClick={() => save(p.id, Number(p.agent_price))}
                    className="gap-1"
                  >
                    {saving === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      ))}
    </div>
  );
}
