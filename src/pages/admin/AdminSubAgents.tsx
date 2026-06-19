import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/admin";
import { Check, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";

type SubRow = {
  id: string;
  status: string;
  created_at: string;
  activation_fee_paid: number;
  notes: string | null;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  wallet_balance: number;
  parent_store_name: string;
  parent_store_slug: string;
  parent_agent_name: string | null;
  sub_store_name: string | null;
  sub_store_slug: string | null;
  order_count: number;
  order_revenue: number;
};

export default function AdminSubAgents() {
  const [rows, setRows] = useState<SubRow[]>([]);
  const [fee, setFee] = useState(0);

  const load = async () => {
    const [{ data, error }, { data: settings }] = await Promise.all([
      supabase.rpc("get_admin_subagents"),
      supabase.from("platform_settings").select("sub_agent_activation_fee").eq("id", 1).single(),
    ]);
    if (error) return toast.error(error.message);
    setRows((data as SubRow[]) ?? []);
    setFee(Number(settings?.sub_agent_activation_fee ?? 0));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.rpc("admin_update_sub_agent", { p_sub_agent_id: id, p_status: status });
    if (error) return toast.error(error.message);
    toast.success(`Sub-agent ${status}`);
    load();
  };

  const saveFee = async (val: string) => {
    const { error } = await supabase.from("platform_settings").update({ sub_agent_activation_fee: Number(val) || 0 }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Activation fee updated");
    setFee(Number(val) || 0);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sub-Agents"
        description="Manage sub-agents, their parent agents, stores, and platform orders."
      />

      <AdminCard>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm text-white/60">Sub-agent activation fee (₵)</span>
          <input type="number" defaultValue={fee} onBlur={e => saveFee(e.target.value)} className="w-32 rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white text-sm" />
          <span className="text-xs text-white/40">Deducted from applicant wallet on apply</span>
        </div>
      </AdminCard>

      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Sub-agent</TableHead>
              <TableHead className="text-white/50">Parent agent</TableHead>
              <TableHead className="text-white/50">Sub-agent store</TableHead>
              <TableHead className="text-white/50">Orders</TableHead>
              <TableHead className="text-white/50">Status</TableHead>
              <TableHead className="text-white/50">Applied</TableHead>
              <TableHead className="text-white/50">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-white/40 py-10">No sub-agent applications.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell>
                  <div className="text-white font-medium">{r.user_name ?? "—"}</div>
                  <div className="text-xs text-white/35">{r.user_email ?? r.user_phone}</div>
                  <div className="text-xs text-white/30">Wallet: {formatCurrency(Number(r.wallet_balance))}</div>
                </TableCell>
                <TableCell>
                  <div className="text-white/80">{r.parent_agent_name ?? "—"}</div>
                  <div className="text-xs text-white/40">{r.parent_store_name} /{r.parent_store_slug}</div>
                </TableCell>
                <TableCell>
                  {r.sub_store_slug ? (
                    <Link to={`/store/${r.sub_store_slug}`} target="_blank" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      {r.sub_store_name} <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-xs text-white/40">No store yet</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-white/80">{r.order_count}</div>
                  <div className="text-xs text-amber-400">{formatCurrency(Number(r.order_revenue))}</div>
                </TableCell>
                <TableCell>
                  <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                    <SelectTrigger className="h-8 w-28 bg-white/5 border-white/10 text-white text-xs capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pending", "active", "rejected", "suspended"].map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-white/40">{formatDate(r.created_at)}</TableCell>
                <TableCell className="flex gap-1">
                  {r.status === "pending" && (
                    <>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400" onClick={() => updateStatus(r.id, "active")}><Check className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => updateStatus(r.id, "rejected")}><X className="h-4 w-4" /></Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
