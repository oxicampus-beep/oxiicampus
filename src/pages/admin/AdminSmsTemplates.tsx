import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

type Template = { id: string; slug: string; name: string; body: string; active: boolean };

export default function AdminSmsTemplates() {
  const [rows, setRows] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("sms_templates").select("*").order("name");
    setRows((data ?? []) as Template[]);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("sms_templates").update({
      name: editing.name, body: editing.body, active: editing.active, updated_at: new Date().toISOString(),
    }).eq("id", editing.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Template saved");
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="SMS Templates" description="Message templates for order and wallet notifications. Use {{name}}, {{phone}}, {{network}}, {{size_gb}}, {{amount}}, {{balance}}." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard title="Templates" className="p-0">
          <ul className="divide-y divide-white/10">
            {rows.map(t => (
              <li key={t.id}>
                <button type="button" className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors" onClick={() => setEditing({ ...t })}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white">{t.name}</span>
                    <Switch checked={t.active} onClick={e => e.stopPropagation()} onCheckedChange={async v => {
                      await supabase.from("sms_templates").update({ active: v }).eq("id", t.id);
                      load();
                    }} />
                  </div>
                  <span className="text-xs text-white/35 font-mono">{t.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        </AdminCard>

        {editing && (
          <AdminCard title={`Edit: ${editing.name}`}>
            <div className="space-y-4">
              <div><Label className="text-white/70">Name</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
              <div><Label className="text-white/70">Body</Label><Textarea value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1 min-h-[160px] font-mono text-sm" /></div>
              <div className="flex items-center gap-2"><Switch checked={editing.active} onCheckedChange={v => setEditing({ ...editing, active: v })} /><Label className="text-white/70">Active</Label></div>
              <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save template</Button>
            </div>
          </AdminCard>
        )}
      </div>
    </div>
  );
}
