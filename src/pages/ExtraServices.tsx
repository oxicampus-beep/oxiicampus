import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { initiatePaystackPayment, paystackConfigured } from "@/lib/paystack";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAgent } from "@/hooks/useIsAgent";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Sparkles, Tv, GraduationCap, Zap, Users, Loader2, Phone, ArrowRight } from "lucide-react";

const services = [
  { icon: Tv, title: "DStv / GOtv", desc: "Pay TV subscriptions from your wallet.", to: "/dashboard/utilities" },
  { icon: Zap, title: "ECG & Utilities", desc: "Recharge prepaid meters and pay bills.", to: "/dashboard/utilities" },
  { icon: GraduationCap, title: "Result Checkers", desc: "WAEC, BECE & admission vouchers.", to: "/dashboard/result-checker" },
  { icon: Phone, title: "Airtime Top-up", desc: "Send airtime to any network.", to: "/dashboard/buy-airtime" },
];

export default function ExtraServices() {
  const { user } = useAuth();
  const { isAgent } = useIsAgent();
  const { profile, refresh } = useProfile();
  const [slug, setSlug] = useState("");
  const [fee, setFee] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: settings }, { data: sub }] = await Promise.all([
        supabase.from("platform_settings").select("sub_agent_activation_fee").eq("id", 1).maybeSingle(),
        supabase.from("sub_agents").select("status").eq("user_id", user.id).maybeSingle(),
      ]);
      if (settings) setFee(Number(settings.sub_agent_activation_fee ?? 0));
      if (sub) setStatus(sub.status);
    })();
  }, [user]);

  const applySubAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return toast.error("Enter the parent store slug.");
    setApplying(true);
    try {
      if (fee > 0) {
        const email = user?.email;
        if (!email?.includes("@")) return toast.error("Your account needs a valid email for Paystack.");
        if (!paystackConfigured()) return toast.error("Paystack is not configured.");
        await initiatePaystackPayment({
          purpose: "sub_agent_activation",
          email,
          metadata: { parent_store_slug: slug.trim() },
          onSuccess: async () => {
            toast.success("Sub-agent application submitted!");
            setStatus("pending");
            await refresh();
          },
        });
        return;
      }
      const { error } = await supabase.rpc("apply_sub_agent", { p_parent_store_slug: slug.trim() });
      if (error) return toast.error(error.message);
      toast.success("Sub-agent application submitted!");
      setStatus("pending");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">Extra Services</h1>
        <p className="text-muted-foreground mt-1">More ways to grow your reselling business.</p>
      </div>

      {!isAgent && (
        <Card className="p-6 border-primary/30">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-semibold text-lg">Become a Sub-Agent</h2>
                {status && <Badge variant={status === "active" ? "default" : "secondary"} className="capitalize">{status}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Join an existing agent store as a sub-agent. {fee > 0 ? `Activation fee: ₵${fee.toFixed(2)}.` : "No activation fee required."}
              </p>
              {!status && (
                <form onSubmit={applySubAgent} className="mt-4 flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <Label>Parent store slug</Label>
                    <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. my-data-shop" className="mt-1" />
                  </div>
                  <Button type="submit" disabled={applying} className="gap-2 shrink-0">
                    {applying && <Loader2 className="h-4 w-4 animate-spin" />}
                    Apply
                  </Button>
                </form>
              )}
              {status === "pending" && <p className="text-sm text-muted-foreground mt-3">Your application is pending admin approval.</p>}
              {status === "active" && <p className="text-sm text-green-600 mt-3">You are an active sub-agent under your parent store.</p>}
            </div>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {services.map(s => (
          <Link key={s.to} to={s.to}>
            <Card className="p-6 h-full hover:border-primary/40 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/15 text-primary grid place-items-center mb-4"><s.icon className="h-6 w-6" /></div>
              <div className="font-display font-semibold text-lg">{s.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.desc}</div>
              <div className="text-xs text-primary mt-3 flex items-center gap-1 font-bold">Open <ArrowRight className="h-3 w-3" /></div>
            </Card>
          </Link>
        ))}
      </div>

      {isAgent && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Agent tools</h2>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button variant="secondary" size="sm" asChild><Link to="/dashboard/marketing">Marketing</Link></Button>
            <Button variant="secondary" size="sm" asChild><Link to="/dashboard/flyer">Flyer</Link></Button>
            <Button variant="secondary" size="sm" asChild><Link to="/dashboard/bulk">Bulk send</Link></Button>
            <Button variant="secondary" size="sm" asChild><Link to="/dashboard/whatsapp-bot">WhatsApp bot</Link></Button>
          </div>
        </Card>
      )}
    </div>
  );
}
