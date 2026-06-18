import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { formatCurrency } from "@/lib/admin";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { groupSalesByDay } from "@/lib/admin";

export default function AdminPnL() {
  const [data, setData] = useState({ revenue: 0, costs: 0, chart: [] as any[] });

  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase.from("data_orders").select("price, created_at, status").eq("status", "completed");
      const revenue = (orders ?? []).reduce((s, o) => s + Number(o.price), 0);
      const costs = revenue * 0.88;
      setData({ revenue, costs, chart: groupSalesByDay(orders ?? [], 7).map(d => ({ ...d, costs: d.revenue * 0.88, profit: d.revenue * 0.12 })) });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="P&L Report" description="Profit and loss summary for the platform." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Revenue" value={formatCurrency(data.revenue)} accent />
        <AdminStatCard label="Est. COGS" value={formatCurrency(data.costs)} />
        <AdminStatCard label="Net Profit" value={formatCurrency(data.revenue - data.costs)} />
      </div>
      <AdminCard title="7-Day P&L">
        <ChartContainer config={{ profit: { label: "Profit", color: "hsl(51 100% 50%)" } }} className="h-[260px] w-full">
          <BarChart data={data.chart}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickFormatter={v => `₵${v}`} width={48} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="profit" fill="hsl(51 100% 50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </AdminCard>
    </div>
  );
}
