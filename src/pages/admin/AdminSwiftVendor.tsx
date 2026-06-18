import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw, Server } from "lucide-react";

export default function AdminSwiftVendor() {
  const [syncing, setSyncing] = useState(false);
  const [mapped, setMapped] = useState(0);
  const [total, setTotal] = useState(0);

  const load = async () => {
    const { data } = await supabase.from("data_packages").select("id, swift_package_id");
    setTotal(data?.length ?? 0);
    setMapped((data ?? []).filter(p => p.swift_package_id).length);
  };

  useEffect(() => { load(); }, []);

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
        title="Swift Vendor Master"
        description="SwiftData Ghana provider integration — sync plans and manage fulfillment mapping."
        actions={
          <Button onClick={sync} disabled={syncing} className="gap-2 font-semibold">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync SwiftData Plans
          </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Total Packages" value={String(total)} icon={Server} />
        <AdminStatCard label="Swift Mapped" value={String(mapped)} accent sub={`${total ? Math.round((mapped / total) * 100) : 0}% coverage`} />
        <AdminStatCard label="Unmapped" value={String(total - mapped)} sub="Run sync to map plan IDs" />
      </div>
      <AdminCard title="Package Management">
        <p className="text-white/50 text-sm mb-4">Manage bundle pricing and SwiftData plan mappings on the Packages page.</p>
        <Button variant="outline" className="border-white/10 text-white" asChild>
          <a href="/admin/packages">Open Packages →</a>
        </Button>
      </AdminCard>
    </div>
  );
}
