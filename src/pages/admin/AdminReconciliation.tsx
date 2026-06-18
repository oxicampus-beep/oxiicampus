import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";

export default function AdminReconciliation() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: orders }, { data: txns }] = await Promise.all([
        supabase.from("data_orders").select("id, price, status, created_at, recipient_phone").order("created_at", { ascending: false }).limit(50),
        supabase.from("transactions").select("description, amount, created_at, type").eq("type", "purchase").order("created_at", { ascending: false }).limit(50),
      ]);
      const merged = (orders ?? []).map(o => ({
        id: o.id,
        type: "order",
        ref: o.recipient_phone,
        amount: Number(o.price),
        status: o.status,
        date: o.created_at,
        matched: (txns ?? []).some(t => t.description?.includes(o.recipient_phone)),
      }));
      setRows(merged);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Reconciliation" description="Match orders against wallet transactions." />
      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Order</TableHead>
              <TableHead className="text-white/50">Recipient</TableHead>
              <TableHead className="text-white/50">Amount</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Ledger</TableHead>
              <TableHead className="text-white/50">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell className="font-mono text-xs text-white/50">{r.id.slice(0, 8)}…</TableCell>
                <TableCell className="text-white/80">{r.ref}</TableCell>
                <TableCell className="text-amber-400 font-bold">{formatCurrency(r.amount)}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize border-white/20">{r.status}</Badge></TableCell>
                <TableCell>
                  <Badge variant="outline" className={r.matched ? "border-green-500/40 text-green-400" : "border-amber-500/40 text-amber-400"}>
                    {r.matched ? "Matched" : "Review"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-white/40">{formatDate(r.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
