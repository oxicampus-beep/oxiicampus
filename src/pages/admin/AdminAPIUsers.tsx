import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/admin";

export default function AdminAPIUsers() {
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const { data: keys } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email");
    const pmap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    setRows((keys ?? []).map(k => ({ ...k, user: pmap[k.user_id] })));
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("api_keys").update({ active: !active }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="API Users" description="Developer API keys and integration access." />
      <AdminCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Label</TableHead>
              <TableHead className="text-white/50">User</TableHead>
              <TableHead className="text-white/50">Key</TableHead>
              <TableHead className="text-white/50">Created</TableHead>
              <TableHead className="text-white/50">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-white/40 py-10">No API keys.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="border-white/10">
                <TableCell className="text-white font-medium">{r.label}</TableCell>
                <TableCell className="text-sm text-white/70">{r.user?.full_name ?? r.user?.email ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs text-white/50">{r.api_key?.slice(0, 12)}…</TableCell>
                <TableCell className="text-xs text-white/40">{formatDate(r.created_at)}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Switch checked={r.active} onCheckedChange={() => toggle(r.id, r.active)} />
                  <Badge variant="outline" className={r.active ? "border-green-500/40 text-green-400" : "border-white/20 text-white/40"}>
                    {r.active ? "Active" : "Off"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
