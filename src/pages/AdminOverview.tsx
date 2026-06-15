import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Users, ShoppingBag, TrendingUp, Wallet, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate, groupSalesByDay, labelFor, statusBadgeClass } from "@/lib/admin";

type Order = {
  id: string;
  price: number;
  status: string;
  network: string;
  size_gb: number;
  recipient_phone: string;
  created_at: string;
  user_id: string;
  userName?: string | null;
  userPhone?: string | null;
};

function AdminOverviewContent() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalUsers: 0,
    chartData: [] as { date: string; revenue: number; orders: number }[],
    recentOrders: [] as Order[],
    byNetwork: {} as Record<string, number>,
  });

  const load = async () => {
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: orders }, { count: userCount }, { data: profiles }] = await Promise.all([
      supabase.from("data_orders").select("id, user_id, price, status, network, size_gb, recipient_phone, created_at").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("id, full_name, phone"),
    ]);

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    const all = (orders ?? []).map(o => ({
      ...o,
      userName: profileMap[o.user_id]?.full_name,
      userPhone: profileMap[o.user_id]?.phone,
    })) as Order[];
    const completed = all.filter(o => o.status === "completed");
    const todayOrders = all.filter(o => o.created_at.slice(0, 10) === today);

    const byNetwork: Record<string, number> = {};
    completed.forEach(o => { byNetwork[o.network] = (byNetwork[o.network] ?? 0) + Number(o.price); });

    setStats({
      totalRevenue: completed.reduce((s, o) => s + Number(o.price), 0),
      todayRevenue: todayOrders.filter(o => o.status === "completed").reduce((s, o) => s + Number(o.price), 0),
      totalOrders: all.length,
      todayOrders: todayOrders.length,
      totalUsers: userCount ?? 0,
      chartData: groupSalesByDay(completed, 7),
      recentOrders: all.slice(0, 8),
      byNetwork,
    });
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "data_orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    orders: { label: "Orders", color: "hsl(var(--muted-foreground))" },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">Platform-wide stats, revenue, and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} accent />
        <StatCard icon={Wallet} label="Today's Revenue" value={formatCurrency(stats.todayRevenue)} />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders.toString()} sub={`${stats.todayOrders} today`} />
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-display font-semibold mb-4">Sales — Last 7 Days</h2>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={stats.chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={v => `₵${v}`} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-display font-semibold mb-4">Revenue by Network</h2>
          {Object.keys(stats.byNetwork).length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {Object.entries(stats.byNetwork)
                .sort(([, a], [, b]) => b - a)
                .map(([network, revenue]) => (
                  <li key={network} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{labelFor(network)}</span>
                    <span className="font-bold text-primary">{formatCurrency(revenue)}</span>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {stats.recentOrders.map(o => (
              <li key={o.id} className="py-3 flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {o.size_gb}GB {labelFor(o.network)} → {o.recipient_phone}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {o.userName ?? "Unknown user"} · {formatDate(o.created_at)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-primary">{formatCurrency(Number(o.price))}</div>
                  <Badge variant="outline" className={`mt-1 capitalize text-xs ${statusBadgeClass(o.status)}`}>{o.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: boolean;
}) => (
  <Card className={`p-6 ${accent ? "border-primary/40 bg-primary/5" : ""}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className={`h-10 w-10 rounded-lg grid place-items-center ${accent ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
    <div className="text-3xl font-display font-bold">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </Card>
);

export default function AdminOverview() {
  return (
    <AdminGuard>
      <AdminOverviewContent />
    </AdminGuard>
  );
}
