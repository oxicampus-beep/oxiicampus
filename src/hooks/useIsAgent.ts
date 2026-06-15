import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useIsAgent = () => {
  const { user } = useAuth();
  const [isAgent, setIsAgent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsAgent(false); setLoading(false); return; }
    supabase.from("stores").select("id").eq("user_id", user.id).eq("active", true).maybeSingle()
      .then(({ data }) => { setIsAgent(!!data); setLoading(false); });
  }, [user]);

  return { isAgent, loading };
};
