import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

type Banner = {
  id: string; title: string; subtitle: string | null; cta_text: string | null;
  link_url: string | null; audience: string; active: boolean; sort_order: number;
};

const empty = { title: "", subtitle: "", cta_text: "Learn more", link_url: "", audience: "all", sort_order: "0" };

export default function AdminBanners() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("promo_banners").select("*").order("sort_order").order("created_at", { ascending: false });
    setRows((data ?? []) as Banner[]);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("promo_banners").insert({
      title: form.title,
      subtitle: form.subtitle || null,
      cta_text: form.cta_text || null,
      link_url: form.link_url || null,
      audience: form.audience,
      sort_order: Number(form.sort_order) || 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Banner created");
    setForm(empty);
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("promo_banners").update({ active: !active }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("promo_banners").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Promo Banners" description="Banners shown on the user dashboard." />

      <AdminCard title="New banner">
        <form onSubmit={create} className="grid sm:grid-cols-2 gap-4">
          <div><Label className="text-white/70">Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" required /></div>
          <div><Label className="text-white/70">Subtitle</Label><Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
          <div><Label className="text-white/70">CTA text</Label><Input value={form.cta_text} onChange={e => setForm({ ...form, cta_text: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
          <div><Label className="text-white/70">Link URL</Label><Input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="/dashboard/rewards" /></div>
          <div>
            <Label className="text-white/70">Audience</Label>
            <Select value={form.audience} onValueChange={v => setForm({ ...form, audience: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="users">Users only</SelectItem>
                <SelectItem value="agents">Agents only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end"><Button type="submit" disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add banner</Button></div>
        </form>
      </AdminCard>

      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Title</TableHead>
              <TableHead className="text-white/50">Audience</TableHead>
              <TableHead className="text-white/50">Link</TableHead>
              <TableHead className="text-white/50">Active</TableHead>
              <TableHead className="text-white/50" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell>
                  <div className="text-white font-medium">{r.title}</div>
                  {r.subtitle && <div className="text-xs text-white/40">{r.subtitle}</div>}
                </TableCell>
                <TableCell className="capitalize text-white/60">{r.audience}</TableCell>
                <TableCell className="text-xs text-white/50 truncate max-w-[140px]">{r.link_url ?? "—"}</TableCell>
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
