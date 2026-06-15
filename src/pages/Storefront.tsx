import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Store, Wifi } from "lucide-react";
import { labelFor } from "@/components/data/BuyDataDialog";
import StoreBuyDialog from "@/components/store/StoreBuyDialog";
import { whatsappLink } from "@/lib/store";
import { NETWORK_OPTIONS, networksPresent, sortByNetworkThenSize } from "@/lib/networks";

const networkAccent: Record<string, string> = {
  mtn: "border-mtn/40 hover:border-mtn hover:shadow-[0_0_20px_hsl(var(--mtn)/0.25)]",
  airteltigo_ishare: "border-airteltigo/40 hover:border-airteltigo hover:shadow-[0_0_20px_hsl(var(--airteltigo)/0.25)]",
  airteltigo_bigtime: "border-airteltigo/40 hover:border-airteltigo hover:shadow-[0_0_20px_hsl(var(--airteltigo)/0.25)]",
  telecel: "border-telecel/40 hover:border-telecel hover:shadow-[0_0_20px_hsl(var(--telecel)/0.25)]",
};

type StoreRow = { id: string; user_id: string; name: string; whatsapp: string; slug: string };
type Pkg = {
  id: string;
  name: string;
  network: string;
  size_gb: number;
  price: number;
  validity?: string;
};

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<Pkg | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState("mtn");

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
      const present = networksPresent(mapped);
      setActiveNetwork(present.includes("mtn") ? "mtn" : (present[0] ?? "mtn"));
      setLoading(false);
    })();
  }, [slug]);

  const storeNetworks = networksPresent(packages);
  const visible = packages.filter(p => p.network === activeNetwork);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <Card className="p-10 text-center max-w-md">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-display font-bold">Store not found</h1>
          <p className="text-muted-foreground mt-2 text-sm">This store doesn't exist or has been deactivated.</p>
          <Button asChild className="mt-6"><Link to="/auth">Go to ByteBoss</Link></Button>
        </Card>
      </div>
    );
  }

  const supportMsg = `Hi ${store.name}, I have a question about your data bundles.`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/[0.04]">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-primary grid place-items-center font-black text-primary-foreground text-lg shrink-0 glow-yellow">
              {store.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-xl truncate">{store.name}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wifi className="h-3 w-3" /> Data bundles · Ghana
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0 border-green-500/40 text-green-400 hover:bg-green-500/10"
            onClick={() => window.open(whatsappLink(store.whatsapp, supportMsg), "_blank")}
          >
            <MessageCircle className="h-4 w-4" /> Support
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold">Available Bundles</h2>
          <p className="text-muted-foreground text-sm mt-1">Choose a network, then tap a bundle to order via WhatsApp</p>
        </div>

        {packages.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            No packages listed yet. Check back soon!
          </Card>
        ) : (
          <>
            <Tabs value={activeNetwork} onValueChange={setActiveNetwork}>
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-secondary/60 p-1">
                {NETWORK_OPTIONS.filter(n => storeNetworks.includes(n.id)).map(n => (
                  <TabsTrigger key={n.id} value={n.id} className="flex-1 min-w-[5rem] text-xs sm:text-sm">
                    {n.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {visible.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground text-sm">
                No {labelFor(activeNetwork)} bundles listed yet.
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visible.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelected(p); setBuyOpen(true); }}
                    className={`text-left rounded-2xl border-2 bg-card p-5 transition-all duration-200 hover:scale-[1.02] ${networkAccent[p.network] ?? "border-border hover:border-primary/40"}`}
                  >
                    <div className="text-2xl font-display font-black">{p.name}</div>
                    <div className="flex items-end justify-between mt-4">
                      <div>
                        <span className="text-3xl font-bold">{p.size_gb}<span className="text-base ml-0.5">GB</span></span>
                        {p.validity && <div className="text-xs text-muted-foreground mt-1">{p.validity}</div>}
                      </div>
                      <span className="text-xl font-bold text-primary">₵{Number(p.price).toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-muted-foreground/60 pb-8">
          Powered by <Link to="/auth" className="text-primary hover:underline">ByteBoss</Link>
        </p>
      </main>

      <StoreBuyDialog
        pkg={selected}
        storeName={store.name}
        storeOwnerId={store.user_id}
        whatsapp={store.whatsapp}
        open={buyOpen}
        onOpenChange={setBuyOpen}
      />
    </div>
  );
}
