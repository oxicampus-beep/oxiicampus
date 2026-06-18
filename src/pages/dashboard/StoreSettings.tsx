import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { useIsAgent } from "@/hooks/useIsAgent";
import { getStoreUrl } from "@/lib/store";
import { Copy, ExternalLink } from "lucide-react";

export default function StoreSettings() {
  const { user } = useAuth();
  const { isAgent, loading } = useIsAgent();
  const [store, setStore] = useState<{ id: string; name: string; whatsapp: string; slug: string } | null>(null);
  const [form, setForm] = useState({ name: "", whatsapp: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("stores").select("id, name, whatsapp, slug").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) { setStore(data); setForm({ name: data.name, whatsapp: data.whatsapp }); }
      });
  }, [user]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from("stores").update({ name: form.name, whatsapp: form.whatsapp }).eq("id", store.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Store settings saved");
    setStore(s => s ? { ...s, ...form } : s);
  };

  if (!loading && !isAgent) return <Navigate to="/dashboard/my-store" replace />;
  if (!store) return <Navigate to="/dashboard/my-store" replace />;

  const url = getStoreUrl(store.slug);

  return (
    <div className="space-y-6 max-w-xl">
      <DashboardPageHeader title="Store Settings & Branding" description="Manage your public storefront details." badge="Agent" />

      <GlassCard>
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Store URL</Label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={url} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied!"); }}><Copy className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" asChild><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
            </div>
          </div>
          <div><Label>Store name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
          <div><Label>WhatsApp support</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className="mt-1" /></div>
          <Button onClick={save} disabled={saving} className="w-full font-bold">{saving ? "Saving…" : "Save settings"}</Button>
        </div>
      </GlassCard>
    </div>
  );
}
