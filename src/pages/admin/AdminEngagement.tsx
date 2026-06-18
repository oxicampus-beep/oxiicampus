import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { formatCurrency } from "@/lib/admin";
import { Gift, Share2, Trophy } from "lucide-react";

export default function AdminEngagement() {
  const [stats, setStats] = useState({ referrals: 0, points: 0, spins: 0, topReferrers: [] as any[] });

  useEffect(() => {
    (async () => {
      const [{ count: referrals }, { data: ledger }, { count: spins }, { data: refs }] = await Promise.all([
        supabase.from("user_referrals").select("*", { count: "exact", head: true }),
        supabase.from("points_ledger").select("amount"),
        supabase.from("spin_wheel_spins").select("*", { count: "exact", head: true }),
        supabase.from("user_referrals").select("referrer_id, points_awarded").limit(100),
      ]);
      const points = (ledger ?? []).filter(l => l.amount > 0).reduce((s, l) => s + l.amount, 0);
      const byRef: Record<string, number> = {};
      (refs ?? []).forEach(r => { byRef[r.referrer_id] = (byRef[r.referrer_id] ?? 0) + r.points_awarded; });
      const topIds = Object.entries(byRef).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id]) => id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", topIds);
      const pmap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]));
      setStats({
        referrals: referrals ?? 0,
        points,
        spins: spins ?? 0,
        topReferrers: topIds.map(id => ({ name: pmap[id] ?? "User", points: byRef[id] })),
      });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Engagement Hub" description="Referrals, rewards points, and spin wheel activity." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard label="Total Referrals" value={String(stats.referrals)} icon={Share2} accent />
        <AdminStatCard label="Points Awarded" value={String(stats.points)} icon={Trophy} />
        <AdminStatCard label="Wheel Spins" value={String(stats.spins)} icon={Gift} />
      </div>
      <AdminCard title="Top Referrers">
        {stats.topReferrers.length === 0 ? (
          <p className="text-white/40 text-sm">No referral activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {stats.topReferrers.map((r, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-white/70">{r.name}</span>
                <span className="text-amber-400 font-bold">{r.points} pts</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
