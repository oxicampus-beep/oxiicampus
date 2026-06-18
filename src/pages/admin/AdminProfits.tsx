import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { formatCurrency } from "@/lib/admin";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

export default function AdminProfits() {
  const [stats, setStats] = useState({ revenue: 0, cogs: 0, profit: 0, orders: 0, marginPct: 0 });

  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase
        .from("data_orders")
        .select("price, status, package_id, data_packages(provider_cost, agent_price)")
        .eq("status", "completed");

      let revenue = 0, cogs = 0;
      (orders ?? []).forEach((o: any) => {
        const pkg = o.data_packages;
        const cost = Number(pkg?.provider_cost ?? pkg?.agent_price ?? 0);
        revenue += Number(o.price);
        cogs += cost;
      });

      const profit = revenue - cogs;
      setStats({
        revenue, cogs, profit, orders: orders?.length ?? 0,
        marginPct: revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
      });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Profits" description="Platform revenue and cost of goods sold from completed orders." />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard label="Gross Revenue" value={formatCurrency(stats.revenue)} icon={TrendingUp} accent />
        <AdminStatCard label="COGS" value={formatCurrency(stats.cogs)} icon={TrendingDown} />
        <AdminStatCard label="Net Profit" value={formatCurrency(stats.profit)} icon={DollarSign} />
        <AdminStatCard label="Margin" value={`${stats.marginPct}%`} sub={`${stats.orders} orders`} />
      </div>
      <AdminCard>
        <p className="text-white/45 text-sm">COGS uses provider_cost on each package (defaults to 88% of agent price). Set provider_cost in Manage Packages for accuracy.</p>
      </AdminCard>
    </div>
  );
}
