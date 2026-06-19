import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubAgentStatus = "pending" | "active" | "rejected" | "suspended" | null;

export function useDashboardRole() {
  const { user } = useAuth();
  const [hasStore, setHasStore] = useState(false);
  const [subAgentStatus, setSubAgentStatus] = useState<SubAgentStatus>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setHasStore(false);
      setSubAgentStatus(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: store }, { data: sub }] = await Promise.all([
      supabase.from("stores").select("id").eq("user_id", user.id).eq("active", true).maybeSingle(),
      supabase.from("sub_agents").select("status").eq("user_id", user.id).maybeSingle(),
    ]);
    setHasStore(!!store);
    setSubAgentStatus((sub?.status as SubAgentStatus) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isSubAgent = subAgentStatus === "active";
  const isParentAgent = hasStore && !isSubAgent;
  const showAgentNav = isParentAgent || isSubAgent;
  const canRecruitSubAgents = isParentAgent;
  const isAgent = hasStore;

  return {
    loading,
    hasStore,
    subAgentStatus,
    isSubAgent,
    isParentAgent,
    isAgent,
    showAgentNav,
    canRecruitSubAgents,
    refresh,
  };
}
