import { useCallback, useEffect, useId, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AgentPricingExample = {
  label: string;
  sizeGb: number;
  userPrice: number;
  agentPrice: number;
  saved: number;
  pct: number;
  validity: string;
};

type PackageRow = {
  network: string;
  size_gb: number;
  user_price: number;
  agent_price: number;
  validity: string;
};

/** Pick the MTN 1GB offer package (validity contains "offer", else any active MTN 1GB). */
export function pickMtn1GbOfferPackage(rows: PackageRow[]): PackageRow | null {
  const mtn1gb = rows.filter(p => p.network === "mtn" && Number(p.size_gb) === 1);
  if (mtn1gb.length === 0) return null;

  const offer = mtn1gb.find(p => /offer/i.test(p.validity ?? ""));
  return offer ?? mtn1gb[0];
}

export function buildAgentPricingExample(pkg: PackageRow): AgentPricingExample {
  const userPrice = Number(pkg.user_price);
  const agentPrice = Number(pkg.agent_price);
  const saved = Math.max(0, userPrice - agentPrice);
  const pct = userPrice > 0 ? Math.round((saved / userPrice) * 100) : 0;

  return {
    label: "MTN 1GB Offer",
    sizeGb: Number(pkg.size_gb),
    userPrice,
    agentPrice,
    saved,
    pct,
    validity: pkg.validity ?? "Non expiry",
  };
}

export async function fetchMtn1GbOfferPricing(): Promise<AgentPricingExample | null> {
  const { data } = await supabase
    .from("data_packages")
    .select("network, size_gb, user_price, agent_price, validity")
    .eq("network", "mtn")
    .eq("active", true);

  const picked = pickMtn1GbOfferPackage((data ?? []) as PackageRow[]);
  return picked ? buildAgentPricingExample(picked) : null;
}

/** Live MTN 1GB offer user vs agent prices — refreshes when admin updates packages. */
export function useMtn1GbOfferPricing() {
  const [example, setExample] = useState<AgentPricingExample | null>(null);
  const [loading, setLoading] = useState(true);
  const channelId = useId().replace(/:/g, "");

  const load = useCallback(async () => {
    const result = await fetchMtn1GbOfferPricing();
    setExample(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`mtn-1gb-offer-pricing-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "data_packages" },
        () => { load(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load, channelId]);

  return { example, loading };
}
