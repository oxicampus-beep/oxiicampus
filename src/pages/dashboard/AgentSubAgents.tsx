import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Badge } from "@/components/ui/badge";
import { Navigate } from "react-router-dom";
import { useIsAgent } from "@/hooks/useIsAgent";

export default function AgentSubAgents() {
  const { user } = useAuth();
  const { isAgent, loading } = useIsAgent();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !isAgent) return;
    (async () => {
      const { data: store } = await supabase.from("stores").select("id").eq("user_id", user.id).maybeSingle();
      if (!store) return;
      const { data } = await supabase.from("sub_agents")
        .select("id, status, created_at, activation_fee_paid, profiles(full_name, email, phone)")
        .eq("parent_store_id", store.id).order("created_at", { ascending: false });
      setRows(data ?? []);
    })();
  }, [user, isAgent]);

  if (!loading && !isAgent) return <Navigate to="/dashboard/my-store" replace />;

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Subagents" description="Users who applied to resell under your store." badge="Agent" />
      <GlassCard>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sub-agent applications yet. Share your store slug so others can apply under you.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {rows.map(r => (
              <li key={r.id} className="py-4 flex justify-between items-center gap-4">
                <div>
                  <p className="font-bold">{r.profiles?.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.profiles?.email} · {r.profiles?.phone}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <Badge className="capitalize">{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
