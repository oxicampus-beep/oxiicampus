import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminFeatureFlags() {
  const [enabled, setEnabled] = useState(false);
  const [fee, setFee] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("platform_settings").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) { setEnabled(data.store_activation_enabled); setFee(String(data.store_activation_fee)); }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings").update({
      store_activation_enabled: enabled,
      store_activation_fee: enabled ? Number(fee) : 0,
    }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Feature flags saved");
  };

  if (loading) return <div className="text-white/40">Loading…</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <AdminPageHeader title="Feature Flags" description="Toggle platform features and experimental modules." />
      <AdminCard>
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
            <div>
              <Label className="text-white">Store activation fee</Label>
              <p className="text-xs text-white/40 mt-1">Require payment before users can create an agent store.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          {enabled && (
            <div>
              <Label className="text-white/70">Activation fee (₵)</Label>
              <input type="number" value={fee} onChange={e => setFee(e.target.value)} className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white" />
            </div>
          )}
          <Button onClick={save} disabled={saving} className="w-full gap-2 font-semibold">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save flags
          </Button>
        </div>
      </AdminCard>
    </div>
  );
}
