import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, GraduationCap, Copy } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export default function ResultChecker() {
  const { refresh } = useProfile();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [buying, setBuying] = useState<string | null>(null);

  const load = async () => {
    const [{ data: prods }, { data: ords }] = await Promise.all([
      supabase.from("result_checker_products").select("*").eq("active", true).order("price"),
      supabase.from("result_checker_orders").select("*, result_checker_products(name)").order("created_at", { ascending: false }).limit(10),
    ]);
    setProducts(prods ?? []);
    setOrders(ords ?? []);
  };

  useEffect(() => { load(); }, []);

  const buy = async (slug: string) => {
    setBuying(slug);
    const { data: orderId, error } = await supabase.rpc("purchase_result_checker", { p_product_slug: slug, p_quantity: 1 });
    setBuying(null);
    if (error) return toast.error(error.message);
    toast.success("Voucher purchased!");
    await refresh();
    load();
    if (orderId) {
      const { data: order } = await supabase.from("result_checker_orders").select("voucher_codes").eq("id", orderId).single();
      if (order?.voucher_codes?.[0]) {
        await navigator.clipboard.writeText(order.voucher_codes[0]);
        toast.info(`Voucher copied: ${order.voucher_codes[0]}`);
      }
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Voucher code copied!");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <DashboardPageHeader title="Result Checker" description="Buy WAEC, BECE and admission checker vouchers instantly." />

      <div className="grid sm:grid-cols-2 gap-4">
        {products.map(p => (
          <GlassCard key={p.id} className="flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <GraduationCap className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-bold">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
              </div>
            </div>
            <p className="text-2xl font-black text-primary mb-4">₵{Number(p.price).toFixed(2)}</p>
            <Button className="mt-auto font-bold gap-2" disabled={buying === p.slug} onClick={() => buy(p.slug)}>
              {buying === p.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Buy voucher
            </Button>
          </GlassCard>
        ))}
      </div>

      {orders.length > 0 && (
        <GlassCard title="Your vouchers">
          <ul className="divide-y divide-white/10">
            {orders.map(o => (
              <li key={o.id} className="py-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-bold">{o.result_checker_products?.name ?? "Voucher"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{o.status}</Badge>
                </div>
                {o.voucher_codes?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {o.voucher_codes.map((c: string) => (
                      <button key={c} type="button" onClick={() => copyCode(c)} className="inline-flex items-center gap-1 text-xs font-mono bg-black/30 px-2 py-1 rounded-lg hover:bg-black/50">
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
    </div>
  );
}
