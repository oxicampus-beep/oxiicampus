import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";

function AdminSettingsContent() {
  const [enabled, setEnabled] = useState(false);
  const [fee, setFee] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("platform_settings").select("*").eq("id", 1).single();
    if (error) return toast.error(error.message);
    setEnabled(data.store_activation_enabled);
    setFee(String(data.store_activation_fee));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const feeNum = Number(fee);
    if (enabled && (isNaN(feeNum) || feeNum <= 0)) {
      return toast.error("Enter a valid activation fee when enabled.");
    }
    setSaving(true);
    const { error } = await supabase.from("platform_settings").update({
      store_activation_enabled: enabled,
      store_activation_fee: enabled ? feeNum : 0,
    }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Platform settings saved");
  };

  if (loading) return <div className="text-muted-foreground">Loading settings…</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <AdminPageHeader title="Platform Settings" description="Configure store activation and platform-wide options." />
      <AdminCard>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="font-display font-semibold text-lg">Store Activation Fee</h2>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, users must pay from their wallet before creating a store and becoming an agent.
                When disabled, store creation is free.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <Label htmlFor="activation-toggle" className="cursor-pointer">Require activation payment</Label>
              <Switch id="activation-toggle" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {enabled && (
              <div className="space-y-1.5">
                <Label>Activation fee (₵)</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                  placeholder="50.00"
                />
                <p className="text-xs text-muted-foreground">Deducted from the user's wallet when they create their store.</p>
              </div>
            )}
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full font-semibold gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save settings
        </Button>
      </AdminCard>
    </div>
  );
}

export default function AdminSettings() {
  return <AdminSettingsContent />;
}
