import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, GraduationCap, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useIsAgent } from "@/hooks/useIsAgent";
import { useAuth } from "@/contexts/AuthContext";
import { initiatePaystackPayment, paystackConfigured } from "@/lib/paystack";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  user_price: number;
  agent_price: number;
  category: "result_checker" | "admission_form";
};

type Order = {
  id: string;
  created_at: string;
  status: string;
  recipient_phone: string | null;
  voucher_codes: string[];
  result_checker_products: { name: string; category: string } | null;
};

export default function ResultChecker() {
  const { user } = useAuth();
  const { refresh } = useProfile();
  const { isAgent } = useIsAgent();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const load = async () => {
    const [{ data: prods }, { data: ords }] = await Promise.all([
      supabase
        .from("result_checker_products")
        .select("id, slug, name, description, user_price, agent_price, category")
        .eq("active", true)
        .order("sort_order")
        .order("name"),
      supabase
        .from("result_checker_orders")
        .select("id, created_at, status, recipient_phone, voucher_codes, result_checker_products(name, category)")
        .order("created_at", { ascending: false })
        .limit(15),
    ]);
    setProducts((prods ?? []) as Product[]);
    setOrders((ords ?? []) as Order[]);
  };

  useEffect(() => { load(); }, []);

  const priceFor = (p: Product) => (isAgent ? Number(p.agent_price) : Number(p.user_price));

  const openBuy = (p: Product) => {
    setSelected(p);
    setPhone("");
  };

  const pay = async () => {
    if (!selected) return;
    const cleanPhone = phone.replace(/\D/g, "").slice(0, 10);
    if (cleanPhone.length < 10) return toast.error("Enter a valid 10-digit phone number.");
    if (!email.includes("@")) return toast.error("Enter a valid email for payment.");
    if (!paystackConfigured()) return toast.error("Paystack is not configured.");

    setBuying(true);
    try {
      await initiatePaystackPayment({
        purpose: "result_checker",
        email,
        metadata: {
          product_id: selected.id,
          recipient_phone: cleanPhone,
          quantity: 1,
        },
        onSuccess: async (result) => {
          toast.success("Purchase successful!");
          setSelected(null);
          setPhone("");
          await refresh();
          load();
          if (result.order_id) {
            const { data: order } = await supabase
              .from("result_checker_orders")
              .select("voucher_codes")
              .eq("id", result.order_id)
              .single();
            if (order?.voucher_codes?.[0]) {
              await navigator.clipboard.writeText(order.voucher_codes[0]);
              toast.info(`Voucher copied: ${order.voucher_codes[0]}`);
            }
          }
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBuying(false);
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Voucher code copied!");
  };

  const renderGrid = (category: Product["category"]) => {
    const list = products.filter(p => p.category === category);
    if (list.length === 0) {
      return <GlassCard><p className="text-sm text-muted-foreground text-center py-8">No products available yet.</p></GlassCard>;
    }
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {list.map(p => (
          <GlassCard key={p.id} className="flex flex-col cursor-pointer hover:border-primary/40 transition-colors" onClick={() => openBuy(p)}>
            <div className="flex items-start gap-3 mb-3">
              <GraduationCap className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-bold">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
              </div>
            </div>
            <div className="flex items-end justify-between mt-auto pt-2">
              <p className="text-2xl font-black text-primary">₵{priceFor(p).toFixed(2)}</p>
              {isAgent && Number(p.agent_price) < Number(p.user_price) && (
                <Badge variant="secondary" className="text-[10px]">Agent rate</Badge>
              )}
            </div>
            <Button className="mt-4 font-bold w-full" onClick={e => { e.stopPropagation(); openBuy(p); }}>
              Buy now
            </Button>
          </GlassCard>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <DashboardPageHeader
        title="Result Checkers & Admission"
        description="Tap a product, enter your phone number, and pay from your wallet."
      />

      <Tabs defaultValue="result_checker">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="result_checker">Result checkers</TabsTrigger>
          <TabsTrigger value="admission_form">Admission forms</TabsTrigger>
        </TabsList>
        <TabsContent value="result_checker" className="mt-4">
          {renderGrid("result_checker")}
        </TabsContent>
        <TabsContent value="admission_form" className="mt-4">
          {renderGrid("admission_form")}
        </TabsContent>
      </Tabs>

      {orders.length > 0 && (
        <GlassCard title="Your purchases">
          <ul className="divide-y divide-white/10">
            {orders.map(o => (
              <li key={o.id} className="py-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-bold">{o.result_checker_products?.name ?? "Voucher"}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.recipient_phone ? `Phone: ${o.recipient_phone} · ` : ""}
                      {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">{o.status}</Badge>
                </div>
                {o.voucher_codes?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {o.voucher_codes.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => copyCode(c)}
                        className="inline-flex items-center gap-1 text-xs font-mono bg-black/30 px-2 py-1 rounded-lg hover:bg-black/50"
                      >
                        {c} <Copy className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-black text-primary">₵{priceFor(selected).toFixed(2)}</span>
                </div>
                <div className="space-y-1.5">
                  <Label>Payment email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone number</Label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="0241234567"
                    inputMode="numeric"
                  />
                  <p className="text-xs text-muted-foreground">Voucher will be linked to this number.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                <Button
                  onClick={pay}
                  disabled={buying || phone.length < 10 || !email.includes("@")}
                  className="gap-2 font-semibold"
                >
                  {buying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {buying ? "Opening Paystack…" : `Pay ₵${priceFor(selected).toFixed(2)}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
