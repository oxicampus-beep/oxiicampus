import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/admin";
import { Award } from "lucide-react";

export default function AdminAgentPerformance() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: stores } = await supabase.from("stores").select("id, name, user_id, active");
      const { data: orders } = await supabase.from("store_orders").select("store_id, price, status");
      const { data: profiles } = await supabase.from("profiles").select("id, full_name");
      const pmap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]));
      const stats: Record<string, { orders: number; revenue: number }> = {};
      (orders ?? []).forEach(o => {
        if (!stats[o.store_id]) stats[o.store_id] = { orders: 0, revenue: 0 };
        stats[o.store_id].orders++;
        if (o.status === "completed") stats[o.store_id].revenue += Number(o.price ?? 0);
      });
      setRows((stores ?? []).map(s => ({
        name: s.name,
        owner: pmap[s.user_id],
        active: s.active,
        orders: stats[s.id]?.orders ?? 0,
        revenue: stats[s.id]?.revenue ?? 0,
      })).sort((a, b) => b.revenue - a.revenue));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Agent Performance" description="Rank agents by store orders and revenue." />
      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">#</TableHead>
              <TableHead className="text-white/50">Store</TableHead>
              <TableHead className="text-white/50">Owner</TableHead>
              <TableHead className="text-white/50">Orders</TableHead>
              <TableHead className="text-white/50">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} className="border-white/10">
                <TableCell className="text-white/40">{i + 1}</TableCell>
                <TableCell className="text-white font-medium flex items-center gap-2">
                  {i < 3 && <Award className="h-4 w-4 text-amber-400" />}
                  {r.name}
                </TableCell>
                <TableCell className="text-white/70">{r.owner ?? "—"}</TableCell>
                <TableCell>{r.orders}</TableCell>
                <TableCell className="text-amber-400 font-bold">{formatCurrency(r.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
