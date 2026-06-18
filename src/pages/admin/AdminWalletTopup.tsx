import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/admin";

export default function AdminWalletTopup() {
  const [users, setUsers] = useState<{ id: string; full_name: string | null; email: string | null; wallet_balance: number }[]>([]);
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, email, wallet_balance").order("full_name").then(({ data }) => setUsers(data ?? []));
  }, []);

  const selected = users.find(u => u.id === userId);

  const topup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!userId || !amt || amt <= 0) return toast.error("Select a user and enter a valid amount");
    setLoading(true);
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("id", userId).single();
    const newBal = Number(profile?.wallet_balance ?? 0) + amt;
    const { error: updErr } = await supabase.from("profiles").update({ wallet_balance: newBal }).eq("id", userId);
    if (updErr) { setLoading(false); return toast.error(updErr.message); }
    await supabase.from("transactions").insert({
      user_id: userId, type: "topup", amount: amt, balance_after: newBal,
      description: "Admin wallet top-up", status: "success",
    });
    setLoading(false);
    toast.success(`Topped up ${formatCurrency(amt)}`);
    setAmount("");
    const { data } = await supabase.from("profiles").select("id, full_name, email, wallet_balance").order("full_name");
    setUsers(data ?? []);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <AdminPageHeader title="Wallet Top-Up" description="Credit user wallets manually for support or promotions." />
      <AdminCard>
        <form onSubmit={topup} className="space-y-4">
          <div>
            <Label className="text-white/70">User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name ?? u.email} — {formatCurrency(Number(u.wallet_balance))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected && (
            <p className="text-sm text-white/45">Current balance: <span className="text-amber-400 font-bold">{formatCurrency(Number(selected.wallet_balance))}</span></p>
          )}
          <div>
            <Label className="text-white/70">Amount (₵)</Label>
            <Input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full font-semibold gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Credit Wallet
          </Button>
        </form>
      </AdminCard>
    </div>
  );
}
