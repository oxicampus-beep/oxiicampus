import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency, formatDate, groupSalesByDay, labelFor, statusBadgeClass } from "@/lib/admin";
import {
  Activity, ArrowUpRight, Banknote, MessageCircle, Radio, ShoppingBag, TrendingUp, Users, Wallet,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminOverview() {
  const [maintenance, setMaintenance] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0, todayRevenue: 0, totalOrders: 0, todayOrders: 0,
    totalUsers: 0, pendingWithdrawals: 0, openTickets: 0,
    chartData: [] as { date: string; revenue: number; orders: number }[],
    recentOrders: [] as any[],
    byStatus: {} as Record<string, number>,
  });

  const load = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [
      { data: orders }, { count: users }, { data: profiles },
      { count: pendingWd }, { count: tickets },
    ] = await Promise.all([
      supabase.from("data_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("id, full_name, phone"),
      supabase.from("store_withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("issues").select("*", { count: "exact", head: true }).eq("status", "open"),
    ]);

    const pmap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    const all = (orders ?? []).map(o => ({ ...o, userName: pmap[o.user_id]?.full_name }));
    const completed = all.filter(o => o.status === "completed");
    const todayOrders = all.filter(o => o.created_at.slice(0, 10) === today);
    const byStatus: Record<string, number> = {};
    all.forEach(o => { byStatus[o.status] = (byStatus[o.status] ?? 0) + 1; });

    setStats({
      totalRevenue: completed.reduce((s, o) => s + Number(o.price), 0),
      todayRevenue: todayOrders.filter(o => o.status === "completed").reduce((s, o) => s + Number(o.price), 0),
      totalOrders: all.length,
      todayOrders: todayOrders.length,
      totalUsers: users ?? 0,
      pendingWithdrawals: pendingWd ?? 0,
      openTickets: tickets ?? 0,
      chartData: groupSalesByDay(completed, 7),
      recentOrders: all.slice(0, 8),
      byStatus,
    });
  };

  useEffect(() => {
    load();
    const channel = supabase.channel("admin-overview-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "data_orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const chartConfig = { revenue: { label: "Revenue", color: "hsl(51 100% 50%)" } };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Overview"
        description="Real-time platform control center — revenue, orders, and operational alerts."
        actions={
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
            <Label htmlFor="maint" className="text-xs text-white/50 whitespace-nowrap">Maintenance</Label>
            <Switch
              id="maint"
              checked={maintenance}
              onCheckedChange={v => { setMaintenance(v); toast.info(v ? "Maintenance mode enabled (UI flag)" : "Maintenance mode disabled"); }}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} accent sub={`${formatCurrency(stats.todayRevenue)} today`} />
        <AdminStatCard label="Total Orders" value={String(stats.totalOrders)} icon={ShoppingBag} sub={`${stats.todayOrders} today`} />
        <AdminStatCard label="Total Users" value={String(stats.totalUsers)} icon={Users} />
        <AdminStatCard label="Today's Revenue" value={formatCurrency(stats.todayRevenue)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/admin/withdrawals">
          <AdminStatCard label="Pending Withdrawals" value={String(stats.pendingWithdrawals)} icon={Banknote} className="hover:border-amber-400/30 transition-colors cursor-pointer" />
        </Link>
        <Link to="/admin/tickets">
          <AdminStatCard label="Open Tickets" value={String(stats.openTickets)} icon={MessageCircle} className="hover:border-amber-400/30 transition-colors cursor-pointer" />
        </Link>
        <AdminStatCard label="Processing Orders" value={String(stats.byStatus.processing ?? 0)} icon={Activity} sub={`${stats.byStatus.failed ?? 0} failed`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminCard title="Sales — Last 7 Days" className="lg:col-span-2">
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={stats.chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickFormatter={v => `₵${v}`} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="hsl(51 100% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </AdminCard>

        <AdminCard title="Order Status">
          <ul className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <li key={status} className="flex justify-between items-center text-sm">
                <Badge variant="outline" className={`capitalize ${statusBadgeClass(status)}`}>{status}</Badge>
                <span className="font-bold text-white">{count}</span>
              </li>
            ))}
            {Object.keys(stats.byStatus).length === 0 && <p className="text-white/40 text-sm">No orders yet.</p>}
          </ul>
        </AdminCard>
      </div>

      <AdminCard title="Recent Orders">
        <div className="flex justify-end mb-4">
          <Link to="/admin/orders" className="text-sm text-amber-400 hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="text-white/40 text-sm">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {stats.recentOrders.map(o => (
              <li key={o.id} className="py-3 flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-white truncate">{o.size_gb}GB {labelFor(o.network)} → {o.recipient_phone}</div>
                  <div className="text-xs text-white/35">{o.userName ?? "User"} · {formatDate(o.created_at)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-amber-400">{formatCurrency(Number(o.price))}</div>
                  <Badge variant="outline" className={`mt-1 capitalize text-xs ${statusBadgeClass(o.status)}`}>{o.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <div className="flex items-center gap-2 text-xs text-white/30">
        <Radio className="h-3 w-3 text-green-500 animate-pulse" />
        Live updates enabled · Press <kbd className="border border-white/10 rounded px-1">⌘K</kbd> to jump to any admin page
      </div>
    </div>
  );
}
