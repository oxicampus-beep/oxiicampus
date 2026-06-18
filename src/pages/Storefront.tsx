import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Store } from "lucide-react";
import StoreBuyDialog from "@/components/store/StoreBuyDialog";
import OrderTrackerFab from "@/components/orders/OrderTrackerFab";
import StoreHeader from "@/components/store/StoreHeader";
import StoreHero from "@/components/store/StoreHero";
import StoreFooter from "@/components/store/StoreFooter";
import StoreBundleCard, { StoreNetworkSection } from "@/components/store/StoreBundleCard";
import StoreErrorBoundary from "@/components/store/StoreErrorBoundary";
import { StoreThemeProvider, useStoreTheme } from "@/components/store/StoreThemeProvider";
import { whatsappLink } from "@/lib/store";
import { groupByNetwork, sortByNetworkThenSize } from "@/lib/networks";
import { cn } from "@/lib/utils";

type StoreRow = { id: string; user_id: string; name: string; whatsapp: string; slug: string };
type Pkg = {
  id: string;
  name: string;
  network: string;
  size_gb: number;
  price: number;
  validity?: string;
};

function StorefrontContent() {
  const { slug } = useParams<{ slug: string }>();
  const { isDark } = useStoreTheme();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<Pkg | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: s } = await supabase.from("stores").select("*").eq("slug", slug).eq("active", true).maybeSingle();
      if (!s) { setNotFound(true); setLoading(false); return; }
      setStore(s);
      const { data: pkgs } = await supabase
        .from("store_packages")
        .select("id, name, network, size_gb, price, data_packages(validity)")
        .eq("user_id", s.user_id)
        .eq("active", true);
      const mapped = sortByNetworkThenSize((pkgs ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        network: p.network,
        size_gb: p.size_gb,
        price: p.price,
        validity: p.data_packages?.validity ?? "Non expiry",
      })));
      setPackages(mapped);
      setLoading(false);
    })();
  }, [slug]);

  const networkGroups = groupByNetwork(packages);
  const skeletonBg = isDark ? "bg-zinc-800" : "bg-zinc-200";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <Skeleton className={cn("h-14 rounded-xl", skeletonBg)} />
        <Skeleton className={cn("h-40 rounded-2xl", skeletonBg)} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className={cn("h-36 rounded-2xl", skeletonBg)} />)}
        </div>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-[60vh] grid place-items-center p-6">
        <div
          className={cn(
            "rounded-2xl p-10 text-center max-w-md border shadow-sm",
            isDark ? "bg-zinc-900 border-white/10" : "bg-white border-zinc-200",
          )}
        >
          <Store className={cn("h-12 w-12 mx-auto mb-4", isDark ? "text-zinc-500" : "text-zinc-400")} />
          <h1 className={cn("text-2xl font-display font-bold", isDark ? "text-white" : "text-zinc-900")}>
            Store not found
          </h1>
          <p className={cn("mt-2 text-sm", isDark ? "text-zinc-400" : "text-zinc-500")}>
            This store doesn't exist or has been deactivated.
          </p>
          <Button
            className="mt-6 gap-2"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
        </div>
      </div>
    );
  }

  const supportMsg = `Hi ${store.name}, I have a question about your data bundles.`;
  const openWhatsApp = () => window.open(whatsappLink(store.whatsapp, supportMsg), "_blank");

  return (
    <>
      <StoreHeader storeName={store.name} onTrackOrder={() => setTrackerOpen(true)} />
      <StoreHero storeName={store.name} onWhatsApp={openWhatsApp} />

      <main id="bundles" className="max-w-5xl mx-auto px-4 pb-8 space-y-10">
        {packages.length === 0 ? (
          <div
            className={cn(
              "rounded-2xl border p-12 text-center",
              isDark ? "border-white/10 bg-zinc-900/50 text-zinc-400" : "border-zinc-200 bg-white text-zinc-500",
            )}
          >
            No packages listed yet. Check back soon!
          </div>
        ) : (
          networkGroups.map(group => (
            <StoreNetworkSection key={group.network} network={group.network} count={group.items.length}>
              {group.items.map(p => (
                <StoreBundleCard
                  key={p.id}
                  pkg={p}
                  onSelect={() => { setSelected(p); setBuyOpen(true); }}
                />
              ))}
            </StoreNetworkSection>
          ))
        )}
      </main>

      <StoreFooter storeName={store.name} onTrackOrder={() => setTrackerOpen(true)} />

      <StoreBuyDialog
        pkg={selected}
        storeName={store.name}
        storeOwnerId={store.user_id}
        whatsapp={store.whatsapp}
        open={buyOpen}
        onOpenChange={setBuyOpen}
      />
      <OrderTrackerFab
        open={trackerOpen}
        onOpenChange={setTrackerOpen}
        theme={isDark ? "dark" : "light"}
      />
    </>
  );
}

export default function Storefront() {
  return (
    <StoreErrorBoundary>
      <StoreThemeProvider>
        <StorefrontContent />
      </StoreThemeProvider>
    </StoreErrorBoundary>
  );
}
