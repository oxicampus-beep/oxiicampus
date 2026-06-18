import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";

export default function AdminAccountSettings() {
  const { profile, refresh } = useProfile();
  const { user } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refresh();
    toast.success("Profile updated");
  };

  const changePassword = async () => {
    if (pw.next !== pw.confirm) return toast.error("Passwords do not match");
    if (pw.next.length < 6) return toast.error("Password must be at least 6 characters");
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <AdminPageHeader title="My Security" description="Admin account profile and password settings." />
      <AdminCard title="Profile">
        <div className="space-y-4">
          <div>
            <Label className="text-white/70">Email</Label>
            <Input value={profile?.email ?? user?.email ?? ""} disabled className="bg-white/5 border-white/10 text-white/50 mt-1" />
          </div>
          <div>
            <Label className="text-white/70">Full name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
          </div>
          <Button onClick={saveProfile} disabled={saving} className="font-semibold">Save profile</Button>
        </div>
      </AdminCard>
      <AdminCard title="Change password">
        <div className="space-y-4">
          <div>
            <Label className="text-white/70">New password</Label>
            <PasswordInput value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} className="mt-1 bg-white/5 border-white/10" />
          </div>
          <div>
            <Label className="text-white/70">Confirm password</Label>
            <PasswordInput value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} className="mt-1 bg-white/5 border-white/10" />
          </div>
          <Button variant="outline" onClick={changePassword} className="border-white/10 text-white">Update password</Button>
        </div>
      </AdminCard>
    </div>
  );
}
