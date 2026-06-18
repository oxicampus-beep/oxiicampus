import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { formatCurrency } from "@/lib/admin";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

export default function AdminProfits() {
  const [stats, setStats] = useState({ revenue: 0, margin: 0, orders: 0 });

  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase.from("data_orders").select("price, status, size_gb").eq("status", "completed");
      const revenue = (orders ?? []).reduce((s, o) => s + Number(o.price), 0);
      const margin = revenue * 0.12;
      setStats({ revenue, margin, orders: orders?.length ?? 0 });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Profits" description="Platform revenue and estimated margin from data sales." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Gross Revenue" value={formatCurrency(stats.revenue)} icon={TrendingUp} accent />
        <AdminStatCard label="Est. Margin (~12%)" value={formatCurrency(stats.margin)} icon={DollarSign} />
        <AdminStatCard label="Completed Orders" value={String(stats.orders)} icon={TrendingDown} />
      </div>
      <AdminCard>
        <p className="text-white/45 text-sm">Margin is estimated from completed order volume. Configure cost prices on packages for precise profit tracking.</p>
      </AdminCard>
    </div>
  );
}
