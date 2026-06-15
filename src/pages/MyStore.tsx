import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Store, Package, ShoppingCart, Banknote, Copy, ExternalLink, Share2,
  Trash2, Link2, MessageCircle, Pencil, Check, Loader2, Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getStoreUrl, slugify, whatsappLink } from "@/lib/store";
import { labelFor } from "@/components/data/BuyDataDialog";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";

type CatalogPkg = {
  id: string;
  network: string;
  size_gb: number;
  agent_price: number;
  validity: string;
};

function catalogLabel(p: { size_gb: number; network: string }) {
  return `${p.size_gb}GB · ${labelFor(p.network)}`;
}

type StoreRow = {
  id: string;
  name: string;
  whatsapp: string;
  slug: string;
};

type StorePkg = {
  id: string;
  name: string;
  network: string;
  size_gb: number;
  price: number;
  cost_price: number | null;
  data_package_id: string | null;
};

export default function MyStore() {
  const { user } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ packages: 0, orders: 0, revenue: 0 });
  const [packages, setPackages] = useState<StorePkg[]>([]);
  const [catalog, setCatalog] = useState<CatalogPkg[]>([]);
  const [activation, setActivation] = useState({ enabled: false, fee: 0 });

  const [createForm, setCreateForm] = useState({ name: "", whatsapp: "" });
  const [editForm, setEditForm] = useState({ name: "", whatsapp: "" });
  const [pkgForm, setPkgForm] = useState({ data_package_id: "", sell_price: "" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: s }, { count: pCount }, { data: orders }, { data: pkgs }, { data: settings }, { data: catalogPkgs }] = await Promise.all([
      supabase.from("stores").select("id, name, whatsapp, slug").eq("user_id", user.id).maybeSingle(),
      supabase.from("store_packages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("store_orders").select("price").eq("store_owner_id", user.id),
      supabase.from("store_packages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("platform_settings").select("store_activation_enabled, store_activation_fee").eq("id", 1).maybeSingle(),
      supabase.from("data_packages").select("id, network, size_gb, agent_price, validity").eq("active", true).order("network").order("size_gb"),
    ]);
    setStore(s ?? null);
    if (s) setEditForm({ name: s.name, whatsapp: s.whatsapp });
    if (settings) setActivation({ enabled: settings.store_activation_enabled, fee: Number(settings.store_activation_fee) });
    setStats({
      packages: pCount ?? 0,
      orders: orders?.length ?? 0,
      revenue: (orders ?? []).reduce((sum, o) => sum + Number(o.price), 0),
    });
    setPackages((pkgs ?? []) as StorePkg[]);
    setCatalog((catalogPkgs ?? []) as CatalogPkg[]);
    setLoading(false);
  };

  const selectedCatalog = catalog.find(c => c.id === pkgForm.data_package_id);
  const baseCost = selectedCatalog ? Number(selectedCatalog.agent_price) : 0;
  const sellPrice = Number(pkgForm.sell_price);
  const profit = sellPrice > 0 && baseCost > 0 ? sellPrice - baseCost : 0;
  const addedCatalogIds = new Set(packages.map(p => p.data_package_id).filter(Boolean));
  const availableCatalog = catalog.filter(c => !addedCatalogIds.has(c.id));

  useEffect(() => { load(); }, [user]);

  const createStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!createForm.name.trim()) return toast.error("Enter a store name.");
    if (!createForm.whatsapp.trim()) return toast.error("Enter a WhatsApp support number.");
    if (activation.enabled && Number(profile?.wallet_balance ?? 0) < activation.fee) {
      return toast.error(`Insufficient wallet balance. Top up ₵${activation.fee.toFixed(2)} to activate your store.`);
    }
    setCreating(true);
    const slug = slugify(createForm.name);
    const { error } = await supabase.rpc("create_store", {
      p_name: createForm.name.trim(),
      p_whatsapp: createForm.whatsapp.trim(),
      p_slug: slug,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Your store is live! You're now an agent with agent pricing.");
    await refreshProfile();
    load();
  };

  const saveStore = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      name: editForm.name.trim(),
      whatsapp: editForm.whatsapp.trim(),
    }).eq("id", store.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Store updated");
    setEditing(false);
    load();
  };

  const copyLink = () => {
    if (!store) return;
    navigator.clipboard.writeText(getStoreUrl(store.slug));
    toast.success("Store link copied!");
  };

  const shareLink = async () => {
    if (!store) return;
    const url = getStoreUrl(store.slug);
    if (navigator.share) {
      try {
        await navigator.share({ title: store.name, text: `Buy affordable data from ${store.name}`, url });
      } catch { /* cancelled */ }
    } else {
      copyLink();
    }
  };

  const addPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCatalog) return toast.error("Select a platform bundle.");
    const sell = Number(pkgForm.sell_price);
    if (!sell || sell <= 0) return toast.error("Enter a valid sell price.");
    if (sell < baseCost) return toast.error(`Sell price must be at least ₵${baseCost.toFixed(2)} (your base cost).`);
    const { error } = await supabase.from("store_packages").insert({
      user_id: user.id,
      data_package_id: selectedCatalog.id,
      name: catalogLabel(selectedCatalog),
      network: selectedCatalog.network as any,
      size_gb: selectedCatalog.size_gb,
      cost_price: baseCost,
      price: sell,
    });
    if (error) return toast.error(error.message);
    toast.success("Package listed on your store");
    setPkgForm({ data_package_id: "", sell_price: "" });
    load();
  };

  const removePackage = async (id: string) => {
    await supabase.from("store_packages").delete().eq("id", id);
    load();
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading your store…</div>;
  }

  /* ── No store yet: setup form ── */
  if (!store) {
    return (
      <div className="space-y-8 max-w-lg mx-auto">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Create Your Store</h1>
          <p className="text-muted-foreground mt-2">
            Set up your mini website to resell data under your own brand. Once created, you become an agent with lower data prices.
          </p>
        </div>

        {activation.enabled && activation.fee > 0 && (
          <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
            <p className="text-sm">
              Store activation fee: <span className="font-bold text-primary">₵{activation.fee.toFixed(2)}</span>
              {" "}— deducted from your wallet. Balance: ₵{Number(profile?.wallet_balance ?? 0).toFixed(2)}
              {Number(profile?.wallet_balance ?? 0) < activation.fee && (
                <> · <Link to="/dashboard/wallet" className="text-primary underline">Top up wallet</Link></>
              )}
            </p>
          </Card>
        )}

        <Card className="p-6 sm:p-8 border-primary/20">
          <form onSubmit={createStore} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Store Name</Label>
              <Input
                required
                placeholder="e.g. Kwame Data Hub"
                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">This is the name customers will see on your store page.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" /> Store Support WhatsApp Number
              </Label>
              <Input
                required
                placeholder="0241234567"
                value={createForm.whatsapp}
                onChange={e => setCreateForm({ ...createForm, whatsapp: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Customers will contact you here to complete orders.</p>
            </div>
            <Button type="submit" disabled={creating} className="w-full h-11 font-semibold gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {activation.enabled && activation.fee > 0
                ? `Create Store · Pay ₵${activation.fee.toFixed(2)}`
                : "Create My Store (Free)"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const storeUrl = getStoreUrl(store.slug);

  /* ── Store exists: dashboard ── */
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-display font-bold">{store.name}</h1>
            <Badge>Agent</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Manage your mini store, packages, and share your link. You get agent pricing on data purchases.</p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit details
          </Button>
        ) : (
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEditForm({ name: store.name, whatsapp: store.whatsapp }); }}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={saveStore} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
            </Button>
          </div>
        )}
      </div>

      {editing && (
        <Card className="p-5 grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Store Name</Label>
            <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp Support</Label>
            <Input value={editForm.whatsapp} onChange={e => setEditForm({ ...editForm, whatsapp: e.target.value })} />
          </div>
        </Card>
      )}

      {/* Store link card */}
      <Card className="p-6 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-5 w-5 text-primary" />
          <h2 className="font-display font-semibold text-lg">Your Store Link</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input readOnly value={storeUrl} className="font-mono text-sm bg-background" />
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 flex-1 sm:flex-none" onClick={copyLink}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 flex-1 sm:flex-none" onClick={shareLink}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
            <Button size="sm" className="gap-1.5 flex-1 sm:flex-none" asChild>
              <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Visit
              </a>
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          WhatsApp support:{" "}
          <button
            type="button"
            className="text-green-400 hover:underline"
            onClick={() => window.open(whatsappLink(store.whatsapp, `Hi ${store.name}`), "_blank")}
          >
            {store.whatsapp}
          </button>
        </p>
      </Card>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Packages</div>
          <div className="text-3xl font-display font-bold mt-1">{stats.packages}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Orders</div>
          <div className="text-3xl font-display font-bold mt-1">{stats.orders}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Revenue</div>
          <div className="text-3xl font-display font-bold mt-1 text-primary">₵{stats.revenue.toFixed(2)}</div>
        </Card>
      </div>

      {/* Package management */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-semibold">Store Packages</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Pick admin bundles at agent base price, add your profit, and list on your store website.
        </p>

        <Card className="p-6">
          {availableCatalog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {catalog.length === 0
                ? "No platform bundles available yet. Ask admin to add packages."
                : "You've listed all available platform bundles."}
            </p>
          ) : (
            <form onSubmit={addPackage} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Platform bundle</Label>
                  <Select
                    value={pkgForm.data_package_id}
                    onValueChange={v => setPkgForm({ data_package_id: v, sell_price: "" })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select bundle…" /></SelectTrigger>
                    <SelectContent>
                      {availableCatalog.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {catalogLabel(c)} — base ₵{Number(c.agent_price).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Your sell price (₵)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={baseCost || 0.01}
                    required
                    disabled={!selectedCatalog}
                    placeholder={selectedCatalog ? `Min ₵${baseCost.toFixed(2)}` : "Select a bundle first"}
                    value={pkgForm.sell_price}
                    onChange={e => setPkgForm({ ...pkgForm, sell_price: e.target.value })}
                  />
                </div>
              </div>

              {selectedCatalog && (
                <div className="rounded-lg bg-secondary/50 p-4 grid sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Base cost (agent price)</div>
                    <div className="font-bold">₵{baseCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Your profit</div>
                    <div className={`font-bold ${profit > 0 ? "text-primary" : profit < 0 ? "text-destructive" : ""}`}>
                      {pkgForm.sell_price ? `₵${profit.toFixed(2)}` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Validity</div>
                    <div className="font-medium">{selectedCatalog.validity}</div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full font-semibold" disabled={!selectedCatalog}>
                List on my store
              </Button>
            </form>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          {packages.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No packages listed yet — add your first bundle above.</div>
          ) : (
            <ul className="divide-y divide-border">
              {packages.map(p => {
                const cost = Number(p.cost_price ?? 0);
                const sell = Number(p.price);
                const pProfit = cost > 0 ? sell - cost : null;
                return (
                  <li key={p.id} className="p-4 flex justify-between items-center gap-4">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Base ₵{cost.toFixed(2)} · Sell ₵{sell.toFixed(2)}
                        {pProfit !== null && <> · Profit <span className="text-primary font-medium">₵{pProfit.toFixed(2)}</span></>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removePackage(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/dashboard/store/orders">
          <Card className="p-6 hover:border-primary/40 transition-colors">
            <ShoppingCart className="h-6 w-6 text-primary mb-2" />
            <div className="font-display font-semibold">View Orders</div>
            <div className="text-xs text-muted-foreground mt-1">See customer orders from your store</div>
          </Card>
        </Link>
        <Link to="/dashboard/store/withdrawal">
          <Card className="p-6 hover:border-primary/40 transition-colors">
            <Banknote className="h-6 w-6 text-primary mb-2" />
            <div className="font-display font-semibold">Withdraw Earnings</div>
            <div className="text-xs text-muted-foreground mt-1">Cash out your store revenue</div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
