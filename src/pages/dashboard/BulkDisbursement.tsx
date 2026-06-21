import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { labelFor } from "@/components/data/BuyDataDialog";
import { initiatePaystackPayment, paystackConfigured } from "@/lib/paystack";

export default function BulkDisbursement() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [packageId, setPackageId] = useState("");
  const [phones, setPhones] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [lastItems, setLastItems] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const [{ data: pkgs }, { data: jobs }] = await Promise.all([
      supabase.from("data_packages").select("id, network, size_gb, user_price").eq("active", true).order("size_gb"),
      supabase.from("bulk_disbursement_jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);
    setPackages(pkgs ?? []);
    setJobs(jobs ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const list = phones.split(/[\n,;]+/).map(p => p.trim()).filter(Boolean);
    if (!packageId) return toast.error("Select a package");
    if (list.length === 0) return toast.error("Enter at least one phone number");
    if (list.length > 50) return toast.error("Maximum 50 numbers per batch");
    if (!paystackConfigured()) return toast.error("Paystack is not configured.");

    setLoading(true);
    try {
      await initiatePaystackPayment({
        purpose: "bulk_purchase",
        metadata: { package_id: packageId, phones: list },
        onSuccess: async (result) => {
          if (result.job_id) {
            const { data: items } = await supabase
              .from("bulk_disbursement_items")
              .select("*")
              .eq("job_id", result.job_id);
            setLastItems(items ?? []);
            for (const item of (items ?? []).filter((i: any) => i.data_order_id).slice(0, 10)) {
              await supabase.functions.invoke("fulfill-data-order", { body: { order_id: item.data_order_id } });
            }
            toast.success(`Bulk job complete — ${(items ?? []).filter((i: any) => i.status === "success").length}/${list.length} succeeded`);
          }
          setPhones("");
          load();
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <DashboardPageHeader title="Bulk Disbursement" description="Send the same data bundle to multiple numbers at once (max 50) via Paystack." />

      <GlassCard title="New batch">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Package</Label>
            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select bundle" /></SelectTrigger>
              <SelectContent>
                {packages.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.size_gb}GB {labelFor(p.network)} — ₵{Number(p.user_price).toFixed(2)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Phone numbers (one per line, comma or semicolon separated)</Label>
            <Textarea value={phones} onChange={e => setPhones(e.target.value)} className="mt-1 min-h-[120px] font-mono text-sm" placeholder={"0241234567\n0551234567"} />
          </div>
          <Button type="submit" disabled={loading} className="w-full font-bold gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Opening Paystack…" : "Pay & send batch"}
          </Button>
        </form>
      </GlassCard>

      {lastItems.length > 0 && (
        <GlassCard title="Last batch results">
          <ul className="space-y-2 text-sm">
            {lastItems.map(i => (
              <li key={i.id} className="flex justify-between gap-2">
                <span>{i.recipient_phone}</span>
                <Badge variant={i.status === "success" ? "default" : "destructive"}>{i.status}</Badge>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {jobs.length > 0 && (
        <GlassCard title="Recent jobs">
          <ul className="divide-y divide-border text-sm">
            {jobs.map(j => (
              <li key={j.id} className="py-2 flex justify-between">
                <span>{new Date(j.created_at).toLocaleString()}</span>
                <Badge variant="outline" className="capitalize">{j.status}</Badge>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
