import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency, groupSalesByDay, labelFor } from "@/lib/admin";
import { Area, AreaChart } from "recharts";
import { ShoppingBag, TrendingUp, Users, Wallet } from "lucide-react";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    revenue: 0, orders: 0, users: 0, avgOrder: 0,
    daily: [] as { date: string; revenue: number; orders: number }[],
    byNetwork: [] as { network: string; revenue: number }[],
  });

  useEffect(() => {
    (async () => {
      const [{ data: orders }, { count: users }] = await Promise.all([
        supabase.from("data_orders").select("price, status, network, created_at"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      const completed = (orders ?? []).filter(o => o.status === "completed");
      const revenue = completed.reduce((s, o) => s + Number(o.price), 0);
      const byNet: Record<string, number> = {};
      completed.forEach(o => { byNet[o.network] = (byNet[o.network] ?? 0) + Number(o.price); });

      setStats({
        revenue,
        orders: orders?.length ?? 0,
        users: users ?? 0,
        avgOrder: completed.length ? revenue / completed.length : 0,
        daily: groupSalesByDay(completed, 14),
        byNetwork: Object.entries(byNet).map(([network, revenue]) => ({ network: labelFor(network), revenue })),
      });
    })();
  }, []);

  const chartConfig = { revenue: { label: "Revenue", color: "hsl(51 100% 50%)" } };

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Analytics" description="Platform performance, revenue trends, and network breakdown." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard label="Total Revenue" value={formatCurrency(stats.revenue)} icon={TrendingUp} accent />
        <AdminStatCard label="Total Orders" value={String(stats.orders)} icon={ShoppingBag} />
        <AdminStatCard label="Registered Users" value={String(stats.users)} icon={Users} />
        <AdminStatCard label="Avg Order Value" value={formatCurrency(stats.avgOrder)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard title="Revenue — Last 14 Days">
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={stats.daily}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickFormatter={v => `₵${v}`} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.15} />
            </AreaChart>
          </ChartContainer>
        </AdminCard>

        <AdminCard title="Orders by Day">
          <ChartContainer config={{ orders: { label: "Orders", color: "hsl(200 80% 60%)" } }} className="h-[280px] w-full">
            <BarChart data={stats.daily}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="orders" fill="hsl(200 80% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </AdminCard>
      </div>

      <AdminCard title="Revenue by Network">
        {stats.byNetwork.length === 0 ? (
          <p className="text-white/40 text-sm">No completed orders yet.</p>
        ) : (
          <ul className="space-y-3">
            {stats.byNetwork.sort((a, b) => b.revenue - a.revenue).map(row => (
              <li key={row.network} className="flex justify-between items-center text-sm">
                <span className="text-white/70">{row.network}</span>
                <span className="font-bold text-amber-400">{formatCurrency(row.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
