import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";

export default function AdminMashUpOrders() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase.from("store_orders").select("*").order("created_at", { ascending: false }).limit(100);
      const ownerIds = [...new Set((orders ?? []).map(o => o.store_owner_id))];
      const { data: stores } = await supabase.from("stores").select("user_id, name").in("user_id", ownerIds);
      const { data: packages } = await supabase.from("store_packages").select("id, name, network, size_gb");
      const smap = Object.fromEntries((stores ?? []).map(s => [s.user_id, s.name]));
      const pmap = Object.fromEntries((packages ?? []).map(p => [p.id, p]));
      setRows((orders ?? []).map(o => ({
        ...o,
        storeName: smap[o.store_owner_id] ?? "—",
        pkg: o.package_id ? pmap[o.package_id] : null,
      })));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Mash Up Orders" description="Storefront and agent customer orders across the platform." />
      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Store</TableHead>
              <TableHead className="text-white/50">Phone</TableHead>
              <TableHead className="text-white/50">Package</TableHead>
              <TableHead className="text-white/50">Amount</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-10">No store orders.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell className="text-white/80">{r.storeName}</TableCell>
                <TableCell className="font-mono text-sm text-white/80">{r.customer_phone}</TableCell>
                <TableCell className="text-white/70">{r.pkg ? `${r.pkg.name} (${r.pkg.size_gb}GB)` : "—"}</TableCell>
                <TableCell className="text-amber-400 font-bold">{formatCurrency(Number(r.price))}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize border-white/20">{r.status}</Badge></TableCell>
                <TableCell className="text-xs text-white/40">{formatDate(r.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
