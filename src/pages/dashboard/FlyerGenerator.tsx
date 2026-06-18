import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { getStoreUrl } from "@/lib/store";
import { Navigate } from "react-router-dom";
import { useIsAgent } from "@/hooks/useIsAgent";

export default function FlyerGenerator() {
  const { user } = useAuth();
  const { isAgent, loading } = useIsAgent();
  const [store, setStore] = useState<{ name: string; slug: string; whatsapp: string } | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const flyerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: s } = await supabase.from("stores").select("name, slug, whatsapp").eq("user_id", user.id).maybeSingle();
      if (s) {
        setStore(s);
        const { data: pkgs } = await supabase.from("store_packages").select("name, price, size_gb, network").eq("user_id", user.id).eq("active", true).limit(6);
        setPackages(pkgs ?? []);
      }
    })();
  }, [user]);

  if (!loading && !isAgent) return <Navigate to="/dashboard/my-store" replace />;
  if (!store) return <Navigate to="/dashboard/my-store" replace />;

  const url = getStoreUrl(store.slug);

  const printFlyer = () => {
    const w = window.open("", "_blank");
    if (!w || !flyerRef.current) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Flyer - ${store.name}</title>
      <style>body{margin:0;font-family:system-ui,sans-serif}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${flyerRef.current.outerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
    toast.success("Use Save as PDF in the print dialog");
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Flyer Generator" description="Create a branded promo flyer for your store." badge="Agent" />
      <Button onClick={printFlyer} className="gap-2 font-bold"><Printer className="h-4 w-4" /> Print / Save as PDF</Button>

      <div ref={flyerRef} className="max-w-md mx-auto rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl" style={{ background: "linear-gradient(160deg, #0a0a0f 0%, #1a1500 50%, #0a0a0f 100%)" }}>
        <div className="p-8 text-center text-white">
          <p className="text-amber-400 font-black text-xs uppercase tracking-[0.3em] mb-2">ByteBoss Agent</p>
          <h2 className="text-3xl font-black mb-1">{store.name}</h2>
          <p className="text-white/60 text-sm mb-6">Cheapest Non-Expiry Data Bundles</p>
          {packages.length > 0 ? (
            <ul className="text-left space-y-2 mb-6 bg-black/30 rounded-2xl p-4">
              {packages.map((p, i) => (
                <li key={i} className="flex justify-between font-bold text-sm">
                  <span>{p.name || `${p.size_gb}GB`}</span>
                  <span className="text-amber-400">₵{Number(p.price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/50 mb-6">MTN · Telecel · AirtelTigo — Instant Delivery</p>
          )}
          <div className="bg-amber-400 text-black font-black py-3 px-6 rounded-2xl text-lg mb-4">Shop Now</div>
          <p className="text-xs text-white/50 break-all">{url}</p>
          <p className="text-xs text-white/40 mt-2">WhatsApp: {store.whatsapp}</p>
        </div>
      </div>
    </div>
  );
}
