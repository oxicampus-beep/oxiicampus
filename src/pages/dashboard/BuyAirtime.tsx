import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { initiatePaystackPayment, paystackConfigured } from "@/lib/paystack";

const NETWORKS = [
  { id: "mtn", label: "MTN" },
  { id: "telecel", label: "Telecel" },
  { id: "airteltigo", label: "AirtelTigo" },
];

export default function BuyAirtime() {
  const { user } = useAuth();
  const [form, setForm] = useState({ network: "mtn", phone: "", amount: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (form.phone.length < 10) return toast.error("Enter a valid phone number");
    if (!amt || amt < 1 || amt > 500) return toast.error("Amount must be between ₵1 and ₵500");
    if (!paystackConfigured()) return toast.error("Paystack is not configured.");

    setLoading(true);
    try {
      await initiatePaystackPayment({
        purpose: "airtime",
        metadata: {
          network: form.network,
          recipient_phone: form.phone,
          amount: amt,
        },
        onSuccess: () => {
          toast.success(`₵${amt.toFixed(2)} airtime order placed — delivery in progress`);
          setForm(f => ({ ...f, phone: "", amount: "" }));
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <DashboardPageHeader title="Buy Airtime" description="Send airtime to any Ghanaian network via Paystack." />
      <GlassCard>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Network</Label>
            <Select value={form.network} onValueChange={v => setForm(f => ({ ...f, network: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{NETWORKS.map(n => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Phone number</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} className="mt-1" placeholder="0241234567" /></div>
          <div>
            <Label>Amount (₵)</Label>
            <Input type="number" min="1" max="500" step="0.5" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="mt-1" placeholder="10" />
            <div className="flex flex-wrap gap-2 mt-2">
              {[5, 10, 20, 50].map(v => (
                <Button key={v} type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, amount: String(v) }))}>₵{v}</Button>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full font-semibold gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
            {loading ? "Opening Paystack…" : "Pay with Paystack"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
