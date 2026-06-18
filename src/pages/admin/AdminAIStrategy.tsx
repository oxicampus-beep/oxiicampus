import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { labelFor } from "@/lib/admin";
import { TrendingUp, Users, ShoppingBag, Award } from "lucide-react";

export default function AdminAIStrategy() {
  const [insights, setInsights] = useState({
    topNetwork: "—", topNetworkRev: 0, wowGrowth: 0, inactiveUsers: 0,
    topAgent: "—", avgOrderValue: 0, referralRate: 0,
  });

  useEffect(() => {
    (async () => {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const [{ data: orders }, { data: profiles }, { data: referrals }, { data: stores }, { data: storeOrders }] = await Promise.all([
        supabase.from("data_orders").select("price, status, network, created_at, user_id").eq("status", "completed"),
        supabase.from("profiles").select("id, created_at"),
        supabase.from("user_referrals").select("id"),
        supabase.from("stores").select("id, name, user_id"),
        supabase.from("store_orders").select("store_owner_id, price"),
      ]);

      const completed = orders ?? [];
      const byNet: Record<string, number> = {};
      completed.forEach(o => { byNet[o.network] = (byNet[o.network] ?? 0) + Number(o.price); });
      const topNet = Object.entries(byNet).sort(([, a], [, b]) => b - a)[0];

      const thisWeek = completed.filter(o => new Date(o.created_at) >= weekAgo).reduce((s, o) => s + Number(o.price), 0);
      const lastWeek = completed.filter(o => {
        const d = new Date(o.created_at);
        return d >= twoWeeksAgo && d < weekAgo;
      }).reduce((s, o) => s + Number(o.price), 0);
      const wow = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

      const buyers = new Set(completed.map(o => o.user_id));
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const inactive = (profiles ?? []).filter(p => !buyers.has(p.id) && new Date(p.created_at) < thirtyDaysAgo).length;

      const agentRev: Record<string, number> = {};
      (storeOrders ?? []).forEach(o => { agentRev[o.store_owner_id] = (agentRev[o.store_owner_id] ?? 0) + Number(o.price); });
      const topAgentId = Object.entries(agentRev).sort(([, a], [, b]) => b - a)[0]?.[0];
      const topAgentName = stores?.find(s => s.user_id === topAgentId)?.name ?? "—";

      const revenue = completed.reduce((s, o) => s + Number(o.price), 0);
      const refRate = (profiles?.length ?? 0) > 0 ? ((referrals?.length ?? 0) / profiles!.length) * 100 : 0;

      setInsights({
        topNetwork: topNet ? labelFor(topNet[0]) : "—",
        topNetworkRev: topNet?.[1] ?? 0,
        wowGrowth: Math.round(wow * 10) / 10,
        inactiveUsers: inactive,
        topAgent: topAgentName,
        avgOrderValue: completed.length ? revenue / completed.length : 0,
        referralRate: Math.round(refRate * 10) / 10,
      });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="AI Intelligence Hub" description="Data-driven insights to grow revenue and retention." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard label="Top network" value={insights.topNetwork} sub={`₵${insights.topNetworkRev.toFixed(2)} revenue`} icon={TrendingUp} accent />
        <AdminStatCard label="Week-over-week" value={`${insights.wowGrowth >= 0 ? "+" : ""}${insights.wowGrowth}%`} sub="Revenue change" icon={ShoppingBag} />
        <AdminStatCard label="Inactive users" value={String(insights.inactiveUsers)} sub="No orders in 30+ days" icon={Users} />
        <AdminStatCard label="Referral rate" value={`${insights.referralRate}%`} sub="Users who referred someone" icon={Award} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminCard title="Recommendations">
          <ul className="text-sm text-white/60 space-y-3">
            {insights.wowGrowth < 0 && <li className="text-amber-400">• Revenue dipped this week — consider a promo campaign on {insights.topNetwork}.</li>}
            {insights.inactiveUsers > 5 && <li>• {insights.inactiveUsers} users haven't ordered — send a broadcast notification to re-engage them.</li>}
            {insights.referralRate < 10 && <li>• Referral rate is low — highlight the rewards program in a promo banner.</li>}
            <li>• Top performing agent store: <strong className="text-white">{insights.topAgent}</strong> — feature them in engagement campaigns.</li>
            <li>• Average order value: <strong className="text-amber-400">₵{insights.avgOrderValue.toFixed(2)}</strong> — bundle larger packages to increase AOV.</li>
          </ul>
        </AdminCard>
        <AdminCard title="Focus areas">
          <ul className="text-sm text-white/60 space-y-2">
            <li>Push {insights.topNetwork} bundles in storefront promos</li>
            <li>Run Sentinel checks daily for failed orders</li>
            <li>Sync SwiftData plans before peak hours</li>
            <li>Approve pending sub-agents to expand reach</li>
          </ul>
        </AdminCard>
      </div>
    </div>
  );
}
