import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/admin";
import { Loader2, Shield } from "lucide-react";

export default function AdminSecurity() {
  const [settings, setSettings] = useState({ maintenance_mode: false, purchases_enabled: true, maintenance_message: "" });
  const [admins, setAdmins] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: s }, { data: roles }, { data: logs }] = await Promise.all([
      supabase.from("platform_settings").select("maintenance_mode, purchases_enabled, maintenance_message").eq("id", 1).single(),
      supabase.from("user_roles").select("user_id, created_at").eq("role", "admin"),
      supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(30),
    ]);
    if (s) setSettings({ maintenance_mode: s.maintenance_mode, purchases_enabled: s.purchases_enabled, maintenance_message: s.maintenance_message ?? "" });
    const ids = (roles ?? []).map(r => r.user_id);
    const { data: profiles } = ids.length ? await supabase.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
    setAdmins((profiles ?? []).map(p => ({ ...p, since: roles?.find(r => r.user_id === p.id)?.created_at })));
    setAudit(logs ?? []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings").update({
      maintenance_mode: settings.maintenance_mode,
      purchases_enabled: settings.purchases_enabled,
      maintenance_message: settings.maintenance_message || null,
    }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    await supabase.rpc("admin_log_action", { p_action: "security_settings_update", p_meta: settings as any });
    toast.success("Security settings saved");
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Security" description="Platform access controls, maintenance mode, and admin activity." />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdminStatCard label="Administrators" value={String(admins.length)} icon={Shield} accent />
        <AdminStatCard label="Audit events" value={String(audit.length)} sub="Last 30 entries" />
      </div>

      <AdminCard title="Platform controls">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
            <div><Label className="text-white">Maintenance mode</Label><p className="text-xs text-white/40 mt-1">Blocks new data purchases</p></div>
            <Switch checked={settings.maintenance_mode} onCheckedChange={v => setSettings(s => ({ ...s, maintenance_mode: v }))} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
            <div><Label className="text-white">Purchases enabled</Label><p className="text-xs text-white/40 mt-1">Master switch for buying data</p></div>
            <Switch checked={settings.purchases_enabled} onCheckedChange={v => setSettings(s => ({ ...s, purchases_enabled: v }))} />
          </div>
          <div>
            <Label className="text-white/70">Maintenance message</Label>
            <Textarea value={settings.maintenance_message} onChange={e => setSettings(s => ({ ...s, maintenance_message: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" rows={2} />
          </div>
          <Button onClick={save} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save security settings</Button>
        </div>
      </AdminCard>

      <AdminCard title="Administrators">
        <Table>
          <TableBody>
            {admins.map(a => (
              <TableRow key={a.id} className="border-white/10">
                <TableCell className="text-white font-medium">{a.full_name ?? "—"}</TableCell>
                <TableCell className="text-white/50 text-sm">{a.email}</TableCell>
                <TableCell><Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30">Admin</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>

      <AdminCard title="Recent audit log" className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/50">Action</TableHead>
              <TableHead className="text-white/50">Entity</TableHead>
              <TableHead className="text-white/50">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audit.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center text-white/40 py-6">No audit entries yet.</TableCell></TableRow>
            ) : audit.map(l => (
              <TableRow key={l.id} className="border-white/10">
                <TableCell className="text-white/80 font-mono text-xs">{l.action}</TableCell>
                <TableCell className="text-white/50 text-xs">{l.entity_type ?? "—"} {l.entity_id?.slice(0, 8) ?? ""}</TableCell>
                <TableCell className="text-white/40 text-xs">{formatDate(l.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
