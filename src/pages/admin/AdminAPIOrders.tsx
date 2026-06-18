import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, labelFor, statusBadgeClass } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";

export default function AdminAPIOrders() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("data_orders").select("*").not("provider_reference", "is", null).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setRows(data ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="API Orders" description="Orders placed via the developer API and SwiftData fulfillment." />
      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Bundle</TableHead>
              <TableHead className="text-white/50">Recipient</TableHead>
              <TableHead className="text-white/50">Amount</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Provider</TableHead>
              <TableHead className="text-white/50">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell className="text-white/80">{r.size_gb}GB {labelFor(r.network)}</TableCell>
                <TableCell className="font-mono text-sm">{r.recipient_phone}</TableCell>
                <TableCell className="text-amber-400 font-bold">{formatCurrency(Number(r.price))}</TableCell>
                <TableCell><Badge variant="outline" className={`capitalize ${statusBadgeClass(r.status)}`}>{r.status}</Badge></TableCell>
                <TableCell className="font-mono text-xs text-white/40">{r.provider_order_id?.slice(0, 10) ?? "—"}</TableCell>
                <TableCell className="text-xs text-white/40">{formatDate(r.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
