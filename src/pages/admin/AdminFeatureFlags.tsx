import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState({
    store_activation_enabled: false,
    store_activation_fee: "0",
    maintenance_mode: false,
    purchases_enabled: true,
    spin_wheel_enabled: true,
    referrals_enabled: true,
    sub_agent_activation_fee: "0",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("platform_settings").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setFlags({
        store_activation_enabled: data.store_activation_enabled,
        store_activation_fee: String(data.store_activation_fee),
        maintenance_mode: data.maintenance_mode ?? false,
        purchases_enabled: data.purchases_enabled ?? true,
        spin_wheel_enabled: data.spin_wheel_enabled ?? true,
        referrals_enabled: data.referrals_enabled ?? true,
        sub_agent_activation_fee: String(data.sub_agent_activation_fee ?? 0),
      });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings").update({
      store_activation_enabled: flags.store_activation_enabled,
      store_activation_fee: flags.store_activation_enabled ? Number(flags.store_activation_fee) : 0,
      maintenance_mode: flags.maintenance_mode,
      purchases_enabled: flags.purchases_enabled,
      spin_wheel_enabled: flags.spin_wheel_enabled,
      referrals_enabled: flags.referrals_enabled,
      sub_agent_activation_fee: Number(flags.sub_agent_activation_fee) || 0,
    }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    await supabase.rpc("admin_log_action", { p_action: "feature_flags_update" });
    toast.success("Feature flags saved");
  };

  if (loading) return <div className="text-white/40">Loading…</div>;

  const toggles = [
    { key: "store_activation_enabled" as const, label: "Store activation fee", desc: "Charge fee when creating agent stores" },
    { key: "maintenance_mode" as const, label: "Maintenance mode", desc: "Show maintenance state and block purchases" },
    { key: "purchases_enabled" as const, label: "Purchases enabled", desc: "Master switch for data purchases" },
    { key: "spin_wheel_enabled" as const, label: "Spin wheel", desc: "Enable rewards spin wheel for users" },
    { key: "referrals_enabled" as const, label: "Referrals", desc: "Award points for referral signups" },
  ];

  return (
    <div className="space-y-6 max-w-xl">
      <AdminPageHeader title="Feature Flags" description="Toggle platform features and experimental modules." />
      <AdminCard>
        <div className="space-y-4">
          {toggles.map(t => (
            <div key={t.key} className="flex items-center justify-between rounded-xl border border-white/10 p-4">
              <div><Label className="text-white">{t.label}</Label><p className="text-xs text-white/40 mt-1">{t.desc}</p></div>
              <Switch checked={flags[t.key]} onCheckedChange={v => setFlags(f => ({ ...f, [t.key]: v }))} />
            </div>
          ))}
          {flags.store_activation_enabled && (
            <div><Label className="text-white/70">Store activation fee (₵)</Label><Input type="number" value={flags.store_activation_fee} onChange={e => setFlags(f => ({ ...f, store_activation_fee: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
          )}
          <div><Label className="text-white/70">Sub-agent activation fee (₵)</Label><Input type="number" value={flags.sub_agent_activation_fee} onChange={e => setFlags(f => ({ ...f, sub_agent_activation_fee: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" /></div>
          <Button onClick={save} disabled={saving} className="w-full gap-2 font-semibold">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save flags</Button>
        </div>
      </AdminCard>
    </div>
  );
}
