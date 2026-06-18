import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/admin";
import { NETWORK_OPTIONS } from "@/lib/networks";

type Promo = {
  id: string; code: string; description: string | null; discount_type: string;
  discount_value: number; max_uses: number | null; uses_count: number;
  network: string | null; active: boolean; expires_at: string | null;
};

const empty = {
  code: "", description: "", discount_type: "percent", discount_value: "10",
  max_uses: "", network: "any", min_order_amount: "0",
};

export default function AdminPromotions() {
  const [rows, setRows] = useState<Promo[]>([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Promo[]);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error("Code required");
    setSaving(true);
    const { error } = await supabase.from("promo_codes").insert({
      code: form.code.trim().toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      network: form.network === "any" ? null : form.network,
      min_order_amount: Number(form.min_order_amount) || 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    await supabase.rpc("admin_log_action", { p_action: "promo_create", p_entity_type: "promo_code", p_entity_id: form.code });
    toast.success("Promo code created");
    setForm(empty);
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("promo_codes").update({ active: !active }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Promo Codes" description="Create discount codes for wallet purchases." />

      <AdminCard title="Create promo code">
        <form onSubmit={create} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><Label className="text-white/70">Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="SAVE10" required /></div>
          <div>
            <Label className="text-white/70">Type</Label>
            <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="percent">Percent %</SelectItem><SelectItem value="fixed">Fixed ₵</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label className="text-white/70">Value</Label><Input type="number" step="0.01" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" required /></div>
          <div><Label className="text-white/70">Max uses</Label><Input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Unlimited" /></div>
          <div className="sm:col-span-2"><Label className="text-white/70">Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
          <div>
            <Label className="text-white/70">Network</Label>
            <Select value={form.network} onValueChange={v => setForm({ ...form, network: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any network</SelectItem>
                {NETWORK_OPTIONS.map(n => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end"><Button type="submit" disabled={saving} className="w-full gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create</Button></div>
        </form>
      </AdminCard>

      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Code</TableHead>
              <TableHead className="text-white/50">Discount</TableHead>
              <TableHead className="text-white/50">Uses</TableHead>
              <TableHead className="text-white/50">Network</TableHead>
              <TableHead className="text-white/50">Active</TableHead>
              <TableHead className="text-white/50" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-white/40 py-8">No promo codes yet.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell className="font-mono font-bold text-amber-400">{r.code}</TableCell>
                <TableCell className="text-white/80">{r.discount_type === "percent" ? `${r.discount_value}%` : `₵${r.discount_value}`}</TableCell>
                <TableCell className="text-white/60">{r.uses_count}{r.max_uses ? ` / ${r.max_uses}` : ""}</TableCell>
                <TableCell className="text-white/60 capitalize">{r.network ?? "Any"}</TableCell>
                <TableCell><Switch checked={r.active} onCheckedChange={() => toggle(r.id, r.active)} /></TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
