import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";
import { Link } from "react-router-dom";

type Row = { rank: number; store_name: string; slug: string; order_count: number; revenue: number };

export default function AgentLeaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("get_agent_leaderboard").then(({ data, error }) => {
      if (!error && data) setRows(data as Row[]);
      setLoading(false);
    });
  }, []);

  const medal = (r: number) => {
    if (r === 1) return <Trophy className="h-5 w-5 text-amber-400" />;
    if (r === 2) return <Medal className="h-5 w-5 text-slate-300" />;
    if (r === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="w-5 text-center font-black text-muted-foreground">{r}</span>;
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <DashboardPageHeader title="Agent Leaderboard" description="Top-performing agents by store revenue (last 30 days)." />

      <GlassCard>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agent activity yet this month.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {rows.map(r => (
              <li key={r.slug} className="py-4 flex items-center gap-4">
                <div className="w-8 flex justify-center">{medal(r.rank)}</div>
                <div className="flex-1 min-w-0">
                  <Link to={`/store/${r.slug}`} className="font-bold hover:text-primary truncate block">{r.store_name}</Link>
                  <p className="text-xs text-muted-foreground">{r.order_count} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">₵{Number(r.revenue).toFixed(2)}</p>
                  {r.rank <= 3 && <Badge variant="outline" className="text-[9px] mt-1">Top {r.rank}</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
