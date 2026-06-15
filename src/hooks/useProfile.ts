import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ id: string; full_name: string | null; phone: string | null; wallet_balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile(data as any); setLoading(false);
  };

  useEffect(() => { refresh(); }, [user?.id]);

  return { profile, loading, refresh };
};
