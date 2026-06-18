import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/admin";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

type Agent = {
  id: string; name: string; slug: string; whatsapp: string; active: boolean; created_at: string;
  user_id: string; owner?: string; email?: string; orders: number; revenue: number;
};

export default function AdminAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);

  const load = async () => {
    const [{ data: stores }, { data: profiles }, { data: orders }] = await Promise.all([
      supabase.from("stores").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("store_orders").select("store_id, price"),
    ]);
    const pmap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    const stats: Record<string, { orders: number; revenue: number }> = {};
    (orders ?? []).forEach(o => {
      if (!stats[o.store_id]) stats[o.store_id] = { orders: 0, revenue: 0 };
      stats[o.store_id].orders++;
      stats[o.store_id].revenue += Number(o.price ?? 0);
    });
    setAgents((stores ?? []).map(s => ({
      ...s,
      owner: pmap[s.user_id]?.full_name ?? "—",
      email: pmap[s.user_id]?.email ?? undefined,
      orders: stats[s.id]?.orders ?? 0,
      revenue: stats[s.id]?.revenue ?? 0,
    })));
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("stores").update({ active: !active }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Agents" description="Manage agent stores, activation status, and performance." />
      <AdminCard className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Store</TableHead>
                <TableHead className="text-white/50">Owner</TableHead>
                <TableHead className="text-white/50">WhatsApp</TableHead>
                <TableHead className="text-white/50">Orders</TableHead>
                <TableHead className="text-white/50">Revenue</TableHead>
                <TableHead className="text-white/50">Joined</TableHead>
                <TableHead className="text-white/50">Active</TableHead>
                <TableHead className="text-white/50" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-white/40 py-10">No agents yet.</TableCell></TableRow>
              ) : agents.map(a => (
                <TableRow key={a.id} className="border-white/10">
                  <TableCell className="font-medium text-white">{a.name}</TableCell>
                  <TableCell>
                    <div className="text-white/80">{a.owner}</div>
                    <div className="text-xs text-white/35">{a.email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-white/70">{a.whatsapp}</TableCell>
                  <TableCell className="text-white/80">{a.orders}</TableCell>
                  <TableCell className="text-amber-400 font-bold">{formatCurrency(a.revenue)}</TableCell>
                  <TableCell className="text-xs text-white/40">{formatDate(a.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={a.active ? "border-green-500/40 text-green-400" : "border-white/20 text-white/40"}>
                      {a.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Switch checked={a.active} onCheckedChange={() => toggle(a.id, a.active)} />
                    <Link to={`/store/${a.slug}`} target="_blank" className="text-amber-400 hover:text-amber-300">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>
    </div>
  );
}
