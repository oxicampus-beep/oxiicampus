import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/admin";

export default function AdminCreditManagement() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, email, wallet_balance, points_balance").order("wallet_balance", { ascending: false }).limit(50)
      .then(({ data }) => setRows(data ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Credit Management" description="User wallet balances and reward points across the platform." />
      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">User</TableHead>
              <TableHead className="text-white/50">Wallet</TableHead>
              <TableHead className="text-white/50">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell>
                  <div className="text-white font-medium">{r.full_name ?? "—"}</div>
                  <div className="text-xs text-white/35">{r.email}</div>
                </TableCell>
                <TableCell className="text-amber-400 font-bold">{formatCurrency(Number(r.wallet_balance))}</TableCell>
                <TableCell className="text-white/80">{r.points_balance ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
