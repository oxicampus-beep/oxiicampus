import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ShoppingBag, History, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsAgent } from "@/hooks/useIsAgent";

export default function Overview() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isAgent } = useIsAgent();
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

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-3xl md:text-4xl font-display font-bold">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋</h1>
          <Badge variant={isAgent ? "default" : "secondary"}>{isAgent ? "Agent" : "User"}</Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          {isAgent ? "You're an agent — you get lower prices on data bundles." : "Top up your wallet to buy data, or create a store to become an agent."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Wallet} label="Wallet Balance" value={`₵${Number(profile?.wallet_balance ?? 0).toFixed(2)}`} accent />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.orders.toString()} />
        <StatCard icon={History} label="Total Spent" value={`₵${stats.spent.toFixed(2)}`} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold">Recent Activity</h2>
          <Link to="/dashboard/transactions" className="text-sm text-primary hover:underline flex items-center gap-1">View all <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet — buy your first bundle to get started.</p>
        ) : (
          <ul className="divide-y divide-border">
            {stats.recent.map((t: any) => (
              <li key={t.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{t.description ?? t.type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className={`font-bold ${Number(t.amount) < 0 ? "text-destructive" : "text-primary"}`}>
                  {Number(t.amount) < 0 ? "" : "+"}₵{Math.abs(Number(t.amount)).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, accent }: any) => (
  <Card className={`p-6 ${accent ? "border-primary/40 bg-primary/5" : ""}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className={`h-10 w-10 rounded-lg grid place-items-center ${accent ? "bg-primary text-primary-foreground" : "bg-secondary"}`}><Icon className="h-5 w-5" /></div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
    <div className="text-3xl font-display font-bold">{value}</div>
  </Card>
);
