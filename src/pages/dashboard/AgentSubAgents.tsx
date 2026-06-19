import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Badge } from "@/components/ui/badge";
import { Navigate, Link } from "react-router-dom";
import { useDashboardRole } from "@/hooks/useDashboardRole";

type SubRow = {
  id: string;
  status: string;
  created_at: string;
  activation_fee_paid: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  store_name: string | null;
  store_slug: string | null;
  order_count: number;
};

export default function AgentSubAgents() {
  const { user } = useAuth();
  const { canRecruitSubAgents, loading } = useDashboardRole();
  const [rows, setRows] = useState<SubRow[]>([]);

  useEffect(() => {
    if (!user || !canRecruitSubAgents) return;
    supabase.rpc("get_parent_subagents").then(({ data }) => {
      setRows((data as SubRow[]) ?? []);
    });
  }, [user, canRecruitSubAgents]);

  if (!loading && !canRecruitSubAgents) return <Navigate to="/dashboard/my-store" replace />;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Subagents"
        description="People who signed up under your store. Share your store link so others can apply."
        badge="Agent"
      />
      <GlassCard>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sub-agents yet. They can apply from your public store page — look for &quot;Become a sub-agent&quot;.
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {rows.map(r => (
              <li key={r.id} className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <p className="font-bold">{r.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.email} · {r.phone}</p>
                  {r.store_slug ? (
                    <Link to={`/store/${r.store_slug}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                      {r.store_name} /store/{r.store_slug}
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Store not created yet</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.order_count} platform orders · Applied {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className="capitalize shrink-0">{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
