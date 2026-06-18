import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const TYPES = [
  { id: "ecg", label: "ECG Prepaid", placeholder: "Meter number", hint: "Enter your 11-digit ECG meter number" },
  { id: "water", label: "Ghana Water", placeholder: "Account number", hint: "Your Ghana Water account number" },
  { id: "dstv", label: "DStv", placeholder: "Smartcard / IUC", hint: "DStv smartcard number" },
  { id: "gotv", label: "GOtv", placeholder: "IUC number", hint: "GOtv IUC number" },
];

export default function UtilityBills() {
  const { refresh } = useProfile();
  const [tab, setTab] = useState("ecg");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const current = TYPES.find(t => t.id === tab)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (account.length < 6) return toast.error("Enter a valid account/meter number");
    if (!amt || amt < 5) return toast.error("Minimum amount is ₵5");
    setLoading(true);
    const { error } = await supabase.rpc("purchase_utility", {
      p_utility_type: tab,
      p_account_number: account,
      p_amount: amt,
      p_meta: {},
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bill payment submitted — processing");
    setAccount("");
    setAmount("");
    await refresh();
  };

  return (
    <div className="space-y-6 max-w-lg">
      <DashboardPageHeader title="Utility Bills" description="Pay ECG, water, DStv and GOtv from your wallet." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 bg-white/5 p-1 rounded-xl">
          {TYPES.map(t => <TabsTrigger key={t.id} value={t.id} className="text-xs font-bold rounded-lg">{t.label}</TabsTrigger>)}
        </TabsList>
        {TYPES.map(t => (
          <TabsContent key={t.id} value={t.id}>
            <GlassCard>
              <form onSubmit={submit} className="space-y-4">
                <p className="text-sm text-muted-foreground">{t.hint}</p>
                <div><Label>{t.placeholder}</Label><Input value={account} onChange={e => setAccount(e.target.value)} className="mt-1" /></div>
                <div>
                  <Label>Amount (₵)</Label>
                  <Input type="number" min="5" step="1" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[20, 50, 100, 200].map(v => (
                      <Button key={v} type="button" variant="outline" size="sm" onClick={() => setAmount(String(v))}>₵{v}</Button>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full font-bold gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Pay {current.label}
                </Button>
              </form>
            </GlassCard>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
