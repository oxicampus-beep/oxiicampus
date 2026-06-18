import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { formatCurrency, formatDate, statusBadgeClass } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";

export default function AdminWithdrawals() {
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("store_withdrawals").select("*").order("created_at", { ascending: false });
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone");
    const pmap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    setRows((data ?? []).map(r => ({ ...r, name: pmap[r.user_id]?.full_name, phone: pmap[r.user_id]?.phone })));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("store_withdrawals").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Withdrawal updated");
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Withdrawals" description="Review and process agent withdrawal requests." />
      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Agent</TableHead>
              <TableHead className="text-white/50">MoMo</TableHead>
              <TableHead className="text-white/50">Amount</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Date</TableHead>
              <TableHead className="text-white/50">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-10">No withdrawal requests.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell>
                  <div className="text-white font-medium">{r.name ?? "—"}</div>
                  <div className="text-xs text-white/35">{r.phone}</div>
                </TableCell>
                <TableCell className="text-sm text-white/70">{r.momo_network} · {r.momo_number}</TableCell>
                <TableCell className="font-bold text-amber-400">{formatCurrency(Number(r.amount))}</TableCell>
                <TableCell><Badge variant="outline" className={`capitalize ${statusBadgeClass(r.status)}`}>{r.status}</Badge></TableCell>
                <TableCell className="text-xs text-white/40">{formatDate(r.created_at)}</TableCell>
                <TableCell>
                  <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                    <SelectTrigger className="h-8 w-32 bg-white/5 border-white/10 text-white text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pending", "processing", "completed", "failed"].map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
