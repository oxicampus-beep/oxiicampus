import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, Server, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Provider = "swiftdata" | "datamax";

const PROVIDERS: { id: Provider; label: string; description: string }[] = [
  {
    id: "swiftdata",
    label: "SwiftData",
    description: "Primary Ghana reseller API with plan sync and package ID mapping.",
  },
  {
    id: "datamax",
    label: "Datamax",
    description: "Secondary source — places orders by network + volume via datamax.site API.",
  },
];

export default function AdminSwiftVendor() {
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<Provider>("swiftdata");
  const [mapped, setMapped] = useState(0);
  const [total, setTotal] = useState(0);
  const [swiftOk, setSwiftOk] = useState<boolean | null>(null);
  const [datamaxOk, setDatamaxOk] = useState<boolean | null>(null);
  const [datamaxBalance, setDatamaxBalance] = useState<number | null>(null);

  const load = async () => {
    const [{ data: pkgs }, { data: settings }] = await Promise.all([
      supabase.from("data_packages").select("id, swift_package_id"),
      supabase.from("platform_settings").select("data_fulfillment_provider").eq("id", 1).single(),
    ]);
    setTotal(pkgs?.length ?? 0);
    setMapped((pkgs ?? []).filter(p => p.swift_package_id).length);
    if (settings?.data_fulfillment_provider === "datamax") setProvider("datamax");
    else setProvider("swiftdata");
  };

  useEffect(() => { load(); }, []);

  const testProvider = async (p: Provider) => {
    setTesting(p);
    const { data, error } = await supabase.functions.invoke("test-data-provider", {
      body: { provider: p },
    });
    setTesting(null);
    if (error) return toast.error(error.message);
    if (p === "swiftdata") {
      setSwiftOk(Boolean(data?.success));
      if (!data?.success) toast.error(data?.error ?? "SwiftData check failed");
      else toast.success(`SwiftData connected (${data.plans_count ?? 0} plans)`);
    } else {
      setDatamaxOk(Boolean(data?.success));
      setDatamaxBalance(data?.wallet_balance ?? null);
      if (!data?.success) toast.error(data?.error ?? data?.message ?? "Datamax check failed");
      else toast.success(`Datamax connected — wallet ₵${Number(data.wallet_balance ?? 0).toFixed(2)}`);
    }
  };

  const saveProvider = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("platform_settings")
      .update({ data_fulfillment_provider: provider })
      .eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Active fulfillment provider set to ${provider === "datamax" ? "Datamax" : "SwiftData"}`);
  };

  const sync = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("sync-swift-plans");
    setSyncing(false);
    if (error) return toast.error(error.message);
    if (!data?.success) return toast.error(data?.error ?? "Sync failed");
    toast.success(`Synced ${data.packages_updated ?? 0} packages`);
    load();
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Data Vendor Hub"
        description="Choose your active data fulfillment API and manage SwiftData plan mappings."
        actions={
          <Button onClick={sync} disabled={syncing} className="gap-2 font-semibold">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync SwiftData Plans
          </Button>
        }
      />

      <AdminCard title="Active fulfillment provider">
        <p className="text-white/50 text-sm mb-4">
          New data orders are sent to the selected provider when fulfillment runs (buy flow, admin retry, API).
        </p>
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                provider === p.id
                  ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-white">{p.label}</span>
                {provider === p.id && (
                  <Badge className="bg-primary text-primary-foreground text-[10px]">Active</Badge>
                )}
              </div>
              <p className="text-xs text-white/50">{p.description}</p>
            </button>
          ))}
        </div>
        <Button onClick={saveProvider} disabled={saving} className="font-semibold gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save provider
        </Button>
      </AdminCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AdminCard>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <Label className="text-white">SwiftData</Label>
            </div>
            <Badge variant="outline" className={swiftOk ? "border-green-500/40 text-green-400" : swiftOk === false ? "border-red-500/40 text-red-400" : "border-white/20 text-white/40"}>
              {swiftOk === null ? "Not tested" : swiftOk ? "Connected" : "Error"}
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="border-white/10 text-white" disabled={testing === "swiftdata"} onClick={() => testProvider("swiftdata")}>
            {testing === "swiftdata" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test connection"}
          </Button>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-400" />
              <Label className="text-white">Datamax</Label>
            </div>
            <Badge variant="outline" className={datamaxOk ? "border-green-500/40 text-green-400" : datamaxOk === false ? "border-red-500/40 text-red-400" : "border-white/20 text-white/40"}>
              {datamaxOk === null ? "Not tested" : datamaxOk ? "Connected" : "Error"}
            </Badge>
          </div>
          {datamaxBalance != null && (
            <p className="text-xs text-white/50 mb-2">Wallet balance: ₵{datamaxBalance.toFixed(2)}</p>
          )}
          <Button variant="outline" size="sm" className="border-white/10 text-white" disabled={testing === "datamax"} onClick={() => testProvider("datamax")}>
            {testing === "datamax" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test connection"}
          </Button>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Total Packages" value={String(total)} icon={Server} />
        <AdminStatCard label="Swift Mapped" value={String(mapped)} accent sub={`${total ? Math.round((mapped / total) * 100) : 0}% coverage`} />
        <AdminStatCard label="Unmapped" value={String(total - mapped)} sub="Run sync to map Swift plan IDs" />
      </div>

      <AdminCard title="Package Management">
        <p className="text-white/50 text-sm mb-4">
          SwiftData requires plan ID mapping. Datamax uses network + volume (GB) from each package automatically.
        </p>
        <Button variant="outline" className="border-white/10 text-white" asChild>
          <a href="/admin/packages">Open Packages →</a>
        </Button>
      </AdminCard>
    </div>
  );
}
