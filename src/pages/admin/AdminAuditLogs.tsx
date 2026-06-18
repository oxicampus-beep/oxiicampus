import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/admin";

export default function AdminAuditLogs() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: txns }, { data: points }] = await Promise.all([
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(40),
        supabase.from("points_ledger").select("*").order("created_at", { ascending: false }).limit(40),
      ]);
      const merged = [
        ...(txns ?? []).map(t => ({ ...t, kind: "wallet", label: t.description ?? t.type })),
        ...(points ?? []).map(p => ({ ...p, kind: "points", label: p.description ?? p.source })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 60);
      setRows(merged);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Audit Logs" description="Wallet and points ledger activity across the platform." />
      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Type</TableHead>
              <TableHead className="text-white/50">Description</TableHead>
              <TableHead className="text-white/50">Amount</TableHead>
              <TableHead className="text-white/50">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={`${r.kind}-${r.id}-${i}`} className="border-white/10">
                <TableCell className="capitalize text-white/50 text-xs">{r.kind}</TableCell>
                <TableCell className="text-white/80 text-sm">{r.label}</TableCell>
                <TableCell className={Number(r.amount) >= 0 ? "text-amber-400" : "text-red-400"}>
                  {r.kind === "points" ? `${r.amount} pts` : `₵${Number(r.amount).toFixed(2)}`}
                </TableCell>
                <TableCell className="text-xs text-white/40">{formatDate(r.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
