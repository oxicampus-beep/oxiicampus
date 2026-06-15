import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function StoreWithdrawal() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [f, setF] = useState({ amount: "", momo_number: "", momo_network: "MTN" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("store_withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    const { error } = await supabase.from("store_withdrawals").insert({
      user_id: user.id, amount: Number(f.amount), momo_number: f.momo_number, momo_network: f.momo_network,
    });
    if (error) return toast.error(error.message);
    toast.success("Withdrawal request submitted");
    setF({ amount: "", momo_number: "", momo_network: "MTN" }); load();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-3xl md:text-4xl font-display font-bold">Store Withdrawal</h1>
        <p className="text-muted-foreground mt-1">Withdraw your store earnings to MoMo.</p></div>

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Amount (₵)</Label><Input type="number" min="1" required value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></div>
          <div><Label>MoMo number</Label><Input required value={f.momo_number} onChange={e => setF({ ...f, momo_number: e.target.value })} /></div>
          <div>
            <Label>Network</Label>
            <Select value={f.momo_network} onValueChange={v => setF({ ...f, momo_network: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MTN">MTN MoMo</SelectItem>
                <SelectItem value="AirtelTigo">AirtelTigo Money</SelectItem>
                <SelectItem value="Telecel">Telecel Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full font-semibold">Request Withdrawal</Button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border font-semibold">Recent withdrawals</div>
        {list.length === 0 ? <div className="p-8 text-center text-muted-foreground">None yet.</div> :
          <ul className="divide-y divide-border">
            {list.map(w => (
              <li key={w.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">₵{Number(w.amount).toFixed(2)} → {w.momo_number}</div>
                  <div className="text-xs text-muted-foreground">{w.momo_network} · {new Date(w.created_at).toLocaleString()}</div>
                </div>
                <Badge variant="outline" className="capitalize">{w.status}</Badge>
              </li>
            ))}
          </ul>}
      </Card>
    </div>
  );
}
