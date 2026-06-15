import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function WalletPage() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);

  const loadRecent = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);
    setRecent(data ?? []);
  };

  useEffect(() => { loadRecent(); }, [user]);

  const topUp = async () => {
    if (!user) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setLoading(true);
    const { data, error } = await supabase.rpc("wallet_topup", { p_amount: amt });
    setLoading(false);
    if (error) return toast.error(error.message);
    setAmount("");
    await refresh();
    await loadRecent();
    toast.success(`₵${amt.toFixed(2)} added — new balance ₵${Number(data).toFixed(2)}`);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Wallet</h1>
        <p className="text-muted-foreground mt-1">Top up your wallet to pay for data bundles and store activation.</p>
      </div>

      <Card className="p-8 bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30">
        <div className="text-sm text-muted-foreground">Available balance</div>
        <div className="text-5xl font-display font-black mt-2 text-primary">₵{Number(profile?.wallet_balance ?? 0).toFixed(2)}</div>
        <p className="text-xs text-muted-foreground mt-3">Use your balance to buy data bundles across all networks.</p>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-display font-semibold">Top up</h2>
        <div className="space-y-2">
          <Label>Amount (₵)</Label>
          <Input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 50, 100, 200].map(v => (
            <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))}>₵{v}</Button>
          ))}
        </div>
        <Button onClick={topUp} disabled={loading} className="w-full font-semibold gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Processing…" : "Top up wallet"}
        </Button>
        <p className="text-xs text-muted-foreground">Demo top-up — funds are added instantly to your wallet balance.</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold">Recent Activity</h2>
          <Link to="/dashboard/transactions" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet. Top up to get started.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map(t => (
              <li key={t.id} className="py-3 flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.description ?? t.type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                  <Badge variant="outline" className="mt-1 text-xs capitalize">{t.type}</Badge>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-bold ${Number(t.amount) < 0 ? "text-destructive" : "text-primary"}`}>
                    {Number(t.amount) < 0 ? "" : "+"}₵{Math.abs(Number(t.amount)).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Bal ₵{Number(t.balance_after ?? 0).toFixed(2)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
