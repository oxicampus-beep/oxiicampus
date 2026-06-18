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

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email, wallet_balance").order("full_name");
    setUsers(data ?? []);
  };

  useEffect(() => { loadUsers(); }, []);

  const selected = users.find(u => u.id === userId);

  const topup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!userId || !amt || amt <= 0) return toast.error("Select a user and enter a valid amount");
    setLoading(true);
    const { error } = await supabase.rpc("admin_adjust_wallet", {
      p_user_id: userId,
      p_amount: amt,
      p_description: "Admin wallet top-up",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`Topped up ${formatCurrency(amt)}`);
    setAmount("");
    loadUsers();
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
