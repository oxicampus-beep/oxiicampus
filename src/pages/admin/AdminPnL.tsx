import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { formatCurrency, groupSalesByDay } from "@/lib/admin";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function AdminPnL() {
  const [data, setData] = useState({ revenue: 0, cogs: 0, profit: 0, chart: [] as any[] });

  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase
        .from("data_orders")
        .select("price, created_at, status, data_packages(provider_cost, agent_price)")
        .eq("status", "completed");

      let revenue = 0, cogs = 0;
      const withCost = (orders ?? []).map((o: any) => {
        const cost = Number(o.data_packages?.provider_cost ?? o.data_packages?.agent_price ?? 0);
        revenue += Number(o.price);
        cogs += cost;
        return { price: Number(o.price), created_at: o.created_at, cost };
      });

      const daily = groupSalesByDay(withCost.map(o => ({ price: o.price, created_at: o.created_at })), 7);
      const costRatio = revenue > 0 ? cogs / revenue : 0.88;

      setData({
        revenue, cogs, profit: revenue - cogs,
        chart: daily.map(d => ({ ...d, costs: d.revenue * costRatio, profit: d.revenue * (1 - costRatio) })),
      });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="P&L Report" description="Profit and loss summary for the platform." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Revenue" value={formatCurrency(data.revenue)} accent />
        <AdminStatCard label="COGS" value={formatCurrency(data.cogs)} />
        <AdminStatCard label="Net Profit" value={formatCurrency(data.profit)} />
      </div>
      <AdminCard title="7-Day P&L">
        <ChartContainer config={{ profit: { label: "Profit", color: "hsl(51 100% 50%)" }, costs: { label: "COGS", color: "hsl(0 60% 50%)" } }} className="h-[280px] w-full">
          <BarChart data={data.chart}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickFormatter={v => `₵${v}`} width={48} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="costs" fill="hsl(0 60% 50%)" stackId="a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="profit" fill="hsl(51 100% 50%)" stackId="a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </AdminCard>
    </div>
  );
}
