import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMtn1GbOfferPricing, type AgentPricingExample } from "@/lib/agentPricingExample";
import { initiatePaystackPayment, paystackConfigured } from "@/lib/paystack";

export type SubAgentStatus = "pending" | "active" | "rejected" | "suspended" | null;

export type StoreSubAgentInfo = {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  whatsapp: string;
};

/** MTN 1GB Offer user vs agent/sub-agent wholesale example (live from admin prices). */
export type SubAgentSavings = AgentPricingExample;

export function useStoreSubAgent(storeSlug: string | undefined) {  const { user } = useAuth();
  const [store, setStore] = useState<StoreSubAgentInfo | null>(null);
  const [status, setStatus] = useState<SubAgentStatus>(null);
  const [fee, setFee] = useState(0);
  const [savings, setSavings] = useState<SubAgentSavings | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [applying, setApplying] = useState(false);

  const refresh = useCallback(async () => {
    if (!storeSlug) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    setLoading(true);
    const [{ data: s }, { data: settings }, pricing] = await Promise.all([
      supabase.from("stores").select("id, name, slug, user_id, whatsapp").eq("slug", storeSlug).eq("active", true).maybeSingle(),
      supabase.from("platform_settings").select("sub_agent_activation_fee").eq("id", 1).maybeSingle(),
      fetchMtn1GbOfferPricing(),
    ]);

    if (!s) {
      setNotFound(true);
      setStore(null);
      setLoading(false);
      return;
    }

    setStore(s);
    setNotFound(false);
    setFee(Number(settings?.sub_agent_activation_fee ?? 0));
    setSavings(pricing);
    if (user) {
      const { data: sub } = await supabase.from("sub_agents").select("status").eq("user_id", user.id).maybeSingle();
      setStatus((sub?.status as SubAgentStatus) ?? null);
    } else {
      setStatus(null);
    }

    setLoading(false);
  }, [storeSlug, user]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel(`store-subagent-pricing-${storeSlug ?? "none"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "data_packages" },
        () => { refresh(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeSlug, refresh]);
  const isStoreOwner = !!user && !!store && user.id === store.user_id;
  const canApply = !!user && !isStoreOwner && !status && !!storeSlug;

  const apply = useCallback(async () => {
    if (!storeSlug || !canApply) return { error: new Error("Cannot apply") };
    setApplying(true);
    try {
      if (fee > 0) {
        if (!paystackConfigured()) {
          setApplying(false);
          return { error: new Error("Paystack is not configured.") };
        }
        await initiatePaystackPayment({
          purpose: "sub_agent_activation",
          metadata: { parent_store_slug: storeSlug },
          onSuccess: () => setStatus("pending"),
        });
        return { error: null };
      }
      const { error } = await supabase.rpc("apply_sub_agent", { p_parent_store_slug: storeSlug });
      if (!error) setStatus("pending");
      return { error: error ? new Error(error.message) : null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error("Payment failed") };
    } finally {
      setApplying(false);
    }
  }, [storeSlug, canApply, fee]);

  return {
    store,
    status,
    fee,
    savings,
    savingsLabel: savings?.label ?? null,    loading,
    notFound,
    applying,
    isStoreOwner,
    canApply,
    apply,
    refresh,
  };
}
