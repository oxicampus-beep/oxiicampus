import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useIsAgent } from "@/hooks/useIsAgent";
import { DashboardPageHeader, DashStatCard, GlassCard } from "@/components/dashboard/DashboardUi";
import PromoCarousel from "@/components/dashboard/PromoCarousel";
import LastOrderWidget from "@/components/dashboard/LastOrderWidget";
import QuickNetworkGrid from "@/components/dashboard/QuickNetworkGrid";
import AgentUpgradeBanner from "@/components/dashboard/AgentUpgradeBanner";
import { useMtn1GbOfferPricing } from "@/lib/agentPricingExample";
import { Wallet, ShoppingBag, History, Trophy, ArrowUpRight, Store, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Overview() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isAgent } = useIsAgent();
  const { example: mtnOffer } = useMtn1GbOfferPricing();
  const [stats, setStats] = useState({ orders: 0, spent: 0, recent: [] as any[] });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: orders } = await supabase.from("data_orders").select("price").eq("user_id", user.id);
      const { data: recent } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
      setStats({
        orders: orders?.length ?? 0,
        spent: (orders ?? []).reduce((s, o: any) => s + Number(o.price), 0),
        recent: recent ?? [],
      });
    })();
  }, [user]);

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="space-y-6 md:space-y-8">
      <DashboardPageHeader
        title={`Welcome back${firstName ? `, ${firstName}` : ""} 👋`}
        description={isAgent
          ? "Your agent dashboard — wholesale pricing, store sales, and earnings at a glance."
          : "Buy data bundles, top up your wallet, or start your reselling journey."}
        badge={isAgent ? "Agent" : "User"}
        actions={
          <Button asChild size="lg" className="font-black gap-2 shadow-lg shadow-primary/25">
            <Link to="/dashboard/buy-data">
              <Smartphone className="h-5 w-5" />
              Buy Data Now
            </Link>
          </Button>
        }
      />

      <GlassCard title="Quick Buy — pick a network">
        <QuickNetworkGrid />
        <div className="mt-4 text-center">
          <Link to="/dashboard/buy-data" className="text-sm font-bold text-primary hover:underline">
            View all buy options →
          </Link>
        </div>
      </GlassCard>

      {!isAgent && <AgentUpgradeBanner />}

      <PromoCarousel />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <DashStatCard icon={Wallet} label="Account Balance" value={`₵${Number(profile?.wallet_balance ?? 0).toFixed(2)}`} accent to="/dashboard/wallet" />
        <DashStatCard icon={Trophy} label="Reward Points" value={`${Number(profile?.points_balance ?? 0)}`} to="/dashboard/rewards" />
        <DashStatCard icon={ShoppingBag} label="Total Orders" value={String(stats.orders)} />
        <DashStatCard icon={History} label="Total Spent" value={`₵${stats.spent.toFixed(2)}`} />
      </div>

      {!isAgent && (
        <Link to="/dashboard/my-store" className="block rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent p-5 hover:border-primary/50 transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/20 grid place-items-center"><Store className="h-6 w-6 text-primary" /></div>
            <div className="flex-1">
              <p className="font-black">Unlock Cheaper Agent Prices</p>
              <p className="text-sm text-muted-foreground">
                {mtnOffer
                  ? `${mtnOffer.label}: agents pay ₵${mtnOffer.agentPrice.toFixed(2)} vs ₵${mtnOffer.userPrice.toFixed(2)} for users — save ₵${mtnOffer.saved.toFixed(2)} per bundle.`
                  : "Create your store and pay wholesale rates on every bundle you buy."}
              </p>
            </div>
            <Badge className="bg-primary text-primary-foreground font-black">Become Agent</Badge>
          </div>
        </Link>
      )}

      <LastOrderWidget />

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Recent Activity</h2>
          <Link to="/dashboard/transactions" className="text-sm text-primary font-bold hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet — buy your first bundle to get started.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {stats.recent.map((t: any) => (
              <li key={t.id} className="py-3 flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.description ?? t.type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className={`font-black shrink-0 ${Number(t.amount) < 0 ? "text-destructive" : "text-primary"}`}>
                  {Number(t.amount) < 0 ? "" : "+"}₵{Math.abs(Number(t.amount)).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
