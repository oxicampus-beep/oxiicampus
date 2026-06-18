import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { Activity, Database, ShoppingBag, Users } from "lucide-react";

export default function AdminSystemHealth() {
  const [health, setHealth] = useState({ users: 0, orders: 0, processing: 0, failed: 0, packages: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: orders }, { count: processing }, { count: failed }, { count: packages }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("data_orders").select("*", { count: "exact", head: true }),
        supabase.from("data_orders").select("*", { count: "exact", head: true }).eq("status", "processing"),
        supabase.from("data_orders").select("*", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("data_packages").select("*", { count: "exact", head: true }).eq("active", true),
      ]);
      setHealth({ users: users ?? 0, orders: orders ?? 0, processing: processing ?? 0, failed: failed ?? 0, packages: packages ?? 0 });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="System Health" description="Live platform metrics and operational status." />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminStatCard label="Users" value={String(health.users)} icon={Users} />
        <AdminStatCard label="Orders" value={String(health.orders)} icon={ShoppingBag} accent />
        <AdminStatCard label="Processing" value={String(health.processing)} icon={Activity} />
        <AdminStatCard label="Failed" value={String(health.failed)} icon={Activity} />
        <AdminStatCard label="Active Packages" value={String(health.packages)} icon={Database} />
      </div>
      <AdminCard title="Status">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-white/70">Platform operational</span>
        </div>
        {health.failed > 0 && (
          <p className="text-amber-400 text-sm mt-3">{health.failed} failed order(s) need attention — check Orders.</p>
        )}
      </AdminCard>
    </div>
  );
}
