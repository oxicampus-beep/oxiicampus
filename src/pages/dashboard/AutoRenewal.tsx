import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Play, Trash2, RefreshCw } from "lucide-react";
import { labelFor } from "@/components/data/BuyDataDialog";
import { useProfile } from "@/hooks/useProfile";

export default function AutoRenewal() {
  const { user } = useAuth();
  const { refresh } = useProfile();
  const [packages, setPackages] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [form, setForm] = useState({ package_id: "", phone: "", interval: "30" });
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: pkgs }, { data: sched }] = await Promise.all([
      supabase.from("data_packages").select("id, network, size_gb, user_price, agent_price").eq("active", true).order("network").order("size_gb"),
      supabase.from("auto_renewal_schedules").select("*, data_packages(network, size_gb)").eq("user_id", user.id).eq("active", true).order("created_at", { ascending: false }),
    ]);
    setPackages(pkgs ?? []);
    setSchedules(sched ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.package_id || form.phone.length < 10) return toast.error("Select a package and enter a valid phone.");
    setLoading(true);
    const { error } = await supabase.rpc("create_auto_renewal", {
      p_package_id: form.package_id,
      p_recipient_phone: form.phone,
      p_interval_days: Number(form.interval),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Auto-renewal schedule created");
    setForm({ package_id: "", phone: "", interval: "30" });
    load();
  };

  const runNow = async (id: string) => {
    setRunning(id);
    const { data: orderId, error } = await supabase.rpc("run_auto_renewal", { p_schedule_id: id });
    setRunning(null);
    if (error) return toast.error(error.message);
    toast.success("Renewal order placed!");
    await refresh();
    if (orderId) {
      await supabase.functions.invoke("fulfill-data-order", { body: { order_id: orderId } });
    }
    load();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.rpc("cancel_auto_renewal", { p_schedule_id: id });
    if (error) return toast.error(error.message);
    toast.success("Schedule cancelled");
    load();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <DashboardPageHeader title="Auto-Renewal" description="Schedule recurring data purchases for the same number." />

      <GlassCard title="New schedule">
        <form onSubmit={create} className="space-y-4">
          <div>
            <Label>Package</Label>
            <Select value={form.package_id} onValueChange={v => setForm(f => ({ ...f, package_id: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select bundle" /></SelectTrigger>
              <SelectContent>
                {packages.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.size_gb}GB {labelFor(p.network)} — ₵{Number(p.user_price).toFixed(2)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Recipient phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} className="mt-1" placeholder="0241234567" /></div>
          <div>
            <Label>Repeat every</Label>
            <Select value={form.interval} onValueChange={v => setForm(f => ({ ...f, interval: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="w-full font-bold gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create schedule
          </Button>
        </form>
      </GlassCard>

      <GlassCard title="Active schedules">
        {schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active schedules.</p>
        ) : (
          <ul className="space-y-3">
            {schedules.map(s => (
              <li key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div>
                  <p className="font-bold">{s.data_packages?.size_gb}GB {labelFor(s.data_packages?.network)} → {s.recipient_phone}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Every {s.interval_days} days · Next: {new Date(s.next_run_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="gap-1" disabled={running === s.id} onClick={() => runNow(s.id)}>
                    {running === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Run now
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => cancel(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
