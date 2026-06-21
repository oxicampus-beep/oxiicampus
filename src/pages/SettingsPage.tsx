import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PasskeySettings from "@/components/auth/PasskeySettings";

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [f, setF] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (profile) setF({ full_name: profile.full_name ?? "", phone: profile.phone ?? "" }); }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(f).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved"); refresh();
  };

  return (
    <div className="space-y-6 max-w-xl">
      <DashboardPageHeader title="Account & Security" description="Update your profile and contact information." />
      <GlassCard className="space-y-4">
        <div><Label>Email</Label><Input value={user?.email ?? ""} disabled className="mt-1" /></div>
        <div><Label>Full name</Label><Input value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} className="mt-1" /></div>
        <div><Label>Phone</Label><Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} className="mt-1" /></div>
        <Button onClick={save} disabled={saving} className="w-full font-semibold">{saving ? "..." : "Save changes"}</Button>
      </GlassCard>
      <PasskeySettings />
    </div>
  );
}
