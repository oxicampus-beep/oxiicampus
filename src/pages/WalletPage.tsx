import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function WalletPage() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const topUp = async () => {
    if (!user) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setLoading(true);
    const newBal = +(Number(profile?.wallet_balance ?? 0) + amt).toFixed(2);
    const { error } = await supabase.from("profiles").update({ wallet_balance: newBal }).eq("id", user.id);
    if (error) { setLoading(false); return toast.error(error.message); }
    await supabase.from("transactions").insert({
      user_id: user.id, type: "topup", amount: amt, balance_after: newBal,
      description: `Wallet top-up`, status: "success",
    });
    setAmount(""); await refresh(); setLoading(false);
    toast.success(`₵${amt.toFixed(2)} added to wallet`);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Wallet</h1>
        <p className="text-muted-foreground mt-1">Top up your wallet to pay for data bundles.</p>
      </div>

      <Card className="p-8 bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30">
        <div className="text-sm text-muted-foreground">Available balance</div>
        <div className="text-5xl font-display font-black mt-2 text-primary">₵{Number(profile?.wallet_balance ?? 0).toFixed(2)}</div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-display font-semibold">Top up</h2>
        <div className="space-y-2">
          <Label>Amount (₵)</Label>
          <Input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 50, 100, 200].map(v => (
            <Button key={v} variant="outline" size="sm" onClick={() => setAmount(String(v))}>₵{v}</Button>
          ))}
        </div>
        <Button onClick={topUp} disabled={loading} className="w-full font-semibold">
          {loading ? "..." : "Top up wallet"}
        </Button>
        <p className="text-xs text-muted-foreground">Note: this is a demo top-up. Connect a payment provider later to accept real money.</p>
      </Card>
    </div>
  );
}
