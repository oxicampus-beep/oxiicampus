import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, RefreshCw, Loader2 } from "lucide-react";
import { labelFor } from "@/components/data/BuyDataDialog";
import { groupByNetwork, sortByNetworkThenSize } from "@/lib/networks";

export default function AdminPackages() {
  const { isAdmin, loading } = useIsAdmin();
  const [items, setItems] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [f, setF] = useState({ network: "mtn", size_gb: "", user_price: "", agent_price: "" });
  const VALIDITY = "Non expiry";

  const load = async () => {
    const { data } = await supabase.from("data_packages").select("*");
    setItems(sortByNetworkThenSize(data ?? []));
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("data_packages").insert({
      network: f.network as any,
      size_gb: Number(f.size_gb),
      user_price: Number(f.user_price),
      agent_price: Number(f.agent_price),
      validity: VALIDITY,
    });
    if (error) return toast.error(error.message);
    toast.success("Package created");
    setF({ network: "mtn", size_gb: "", user_price: "", agent_price: "" });
    load();
  };

  const toggle = async (p: any) => { await supabase.from("data_packages").update({ active: !p.active }).eq("id", p.id); load(); };
  const remove = async (id: string) => { await supabase.from("data_packages").delete().eq("id", id); load(); };

  const syncSwiftPlans = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("sync-swift-plans");
    setSyncing(false);
    if (error) return toast.error(error.message);
    if (!data?.success) return toast.error(data?.error ?? "Sync failed");
    toast.success(`SwiftData plans synced — ${data.packages_updated ?? 0} package(s) mapped`);
    load();
  };

  const grouped = groupByNetwork(items);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Manage Packages</h1>
          <p className="text-muted-foreground mt-1">Set user and agent base prices. Sync SwiftData plan IDs before going live.</p>
        </div>
        <Button variant="outline" onClick={syncSwiftPlans} disabled={syncing} className="gap-2 shrink-0">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Sync SwiftData plans
        </Button>
      </div>

      <Card className="p-6">
        <form onSubmit={create} className="grid sm:grid-cols-5 gap-3 items-end">
          <div>
            <Label>Network</Label>
            <Select value={f.network} onValueChange={v => setF({ ...f, network: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn">MTN</SelectItem>
                <SelectItem value="airteltigo_ishare">AT iShare</SelectItem>
                <SelectItem value="airteltigo_bigtime">AT BigTime</SelectItem>
                <SelectItem value="telecel">Telecel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Size (GB)</Label><Input type="number" step="0.1" required value={f.size_gb} onChange={e => setF({ ...f, size_gb: e.target.value })} /></div>
          <div><Label>User price (₵)</Label><Input type="number" step="0.01" required value={f.user_price} onChange={e => setF({ ...f, user_price: e.target.value })} /></div>
          <div><Label>Agent base (₵)</Label><Input type="number" step="0.01" required value={f.agent_price} onChange={e => setF({ ...f, agent_price: e.target.value })} /></div>
          <Button type="submit" className="font-semibold">Add</Button>
        </form>
      </Card>

      {items.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No packages.</Card>
      ) : (
        grouped.map(group => (
          <Card key={group.network} className="p-0 overflow-hidden">
            <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-semibold">{group.label}</h2>
              <span className="text-xs text-muted-foreground">{group.items.length} bundle{group.items.length !== 1 ? "s" : ""}</span>
            </div>
            <ul className="divide-y divide-border">
              {group.items.map(p => (
                <li key={p.id} className="p-4 flex justify-between items-center gap-4">
                  <div>
                    <div className="font-semibold">{p.size_gb}GB · {labelFor(p.network)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Users: ₵{Number(p.user_price).toFixed(2)} · Agent base: ₵{Number(p.agent_price).toFixed(2)} · {VALIDITY}
                      {p.swift_package_id && <> · Swift: <span className="font-mono">{p.swift_package_id}</span></>}
                      {!p.swift_package_id && <> · <span className="text-amber-600">No SwiftData plan mapped</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={p.active} onCheckedChange={() => toggle(p)} />
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  );
}
