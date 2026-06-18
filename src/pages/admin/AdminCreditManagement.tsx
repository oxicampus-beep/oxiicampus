import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/admin";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

export default function AdminCreditManagement() {
  const [rows, setRows] = useState<any[]>([]);
  const [edit, setEdit] = useState<{ user: any; walletDelta: string; pointsDelta: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email, wallet_balance, points_balance").order("wallet_balance", { ascending: false }).limit(100);
    setRows(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const apply = async () => {
    if (!edit) return;
    setSaving(true);
    const w = Number(edit.walletDelta);
    const p = parseInt(edit.pointsDelta, 10);
    if (w) {
      const { error } = await supabase.rpc("admin_adjust_wallet", { p_user_id: edit.user.id, p_amount: w, p_description: "Admin credit adjustment" });
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    if (p) {
      const { error } = await supabase.rpc("admin_adjust_points", { p_user_id: edit.user.id, p_amount: p, p_description: "Admin points adjustment" });
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setSaving(false);
    toast.success("Credits updated");
    setEdit(null);
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Credit Management" description="View and adjust user wallet balances and reward points." />
      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">User</TableHead>
              <TableHead className="text-white/50">Wallet</TableHead>
              <TableHead className="text-white/50">Points</TableHead>
              <TableHead className="text-white/50" />
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
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-amber-400 gap-1" onClick={() => setEdit({ user: r, walletDelta: "", pointsDelta: "" })}>
                    <Pencil className="h-3 w-3" /> Adjust
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>

      <Dialog open={!!edit} onOpenChange={o => !o && setEdit(null)}>
        <DialogContent className="bg-[#111116] border-white/10 text-white">
          <DialogHeader><DialogTitle>Adjust credits — {edit?.user.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Wallet change (₵)</Label>
              <Input type="number" step="0.01" placeholder="e.g. 10 or -5" value={edit?.walletDelta ?? ""} onChange={e => setEdit(ed => ed ? { ...ed, walletDelta: e.target.value } : null)} className="bg-white/5 border-white/10 mt-1" />
              <p className="text-xs text-white/40 mt-1">Current: {formatCurrency(Number(edit?.user.wallet_balance ?? 0))}</p>
            </div>
            <div>
              <Label>Points change</Label>
              <Input type="number" placeholder="e.g. 10 or -20" value={edit?.pointsDelta ?? ""} onChange={e => setEdit(ed => ed ? { ...ed, pointsDelta: e.target.value } : null)} className="bg-white/5 border-white/10 mt-1" />
              <p className="text-xs text-white/40 mt-1">Current: {edit?.user.points_balance ?? 0} pts</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button>
            <Button onClick={apply} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
