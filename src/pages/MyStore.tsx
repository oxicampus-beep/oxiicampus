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

type StoreRow = {
  id: string;
  name: string;
  whatsapp: string;
  slug: string;
};

export default function MyStore() {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({ packages: 0, orders: 0, revenue: 0 });
  const [packages, setPackages] = useState<any[]>([]);

  const [createForm, setCreateForm] = useState({ name: "", whatsapp: "" });
  const [editForm, setEditForm] = useState({ name: "", whatsapp: "" });
  const [pkgForm, setPkgForm] = useState({ name: "", network: "mtn", size_gb: "", price: "" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: s }, { count: pCount }, { data: orders }, { data: pkgs }] = await Promise.all([
      supabase.from("stores").select("id, name, whatsapp, slug").eq("user_id", user.id).maybeSingle(),
      supabase.from("store_packages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("store_orders").select("price").eq("store_owner_id", user.id),
      supabase.from("store_packages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setStore(s ?? null);
    if (s) setEditForm({ name: s.name, whatsapp: s.whatsapp });
    setStats({
      packages: pCount ?? 0,
      orders: orders?.length ?? 0,
      revenue: (orders ?? []).reduce((sum, o) => sum + Number(o.price), 0),
    });
    setPackages(pkgs ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const createStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!createForm.name.trim()) return toast.error("Enter a store name.");
    if (!createForm.whatsapp.trim()) return toast.error("Enter a WhatsApp support number.");
    setCreating(true);
    const slug = slugify(createForm.name);
    const { error } = await supabase.from("stores").insert({
      user_id: user.id,
      name: createForm.name.trim(),
      whatsapp: createForm.whatsapp.trim(),
      slug,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Your store is live!");
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
    if (!user) return;
    const { error } = await supabase.from("store_packages").insert({
      user_id: user.id,
      name: pkgForm.name,
      network: pkgForm.network as any,
      size_gb: Number(pkgForm.size_gb),
      price: Number(pkgForm.price),
    });
    if (error) return toast.error(error.message);
    toast.success("Package added to your store");
    setPkgForm({ name: "", network: "mtn", size_gb: "", price: "" });
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
            Set up your mini website to resell data under your own brand. Share the link with customers anywhere.
          </p>
        </div>

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
              Create My Store
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
          <h1 className="text-3xl md:text-4xl font-display font-bold">{store.name}</h1>
          <p className="text-muted-foreground mt-1">Manage your mini store, packages, and share your link.</p>
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
        <p className="text-sm text-muted-foreground -mt-2">Add bundles that appear on your public store page.</p>

        <Card className="p-6">
          <form onSubmit={addPackage} className="grid sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <Label>Package Name</Label>
              <Input required value={pkgForm.name} onChange={e => setPkgForm({ ...pkgForm, name: e.target.value })} placeholder="MTN 1GB Daily" />
            </div>
            <div>
              <Label>Network</Label>
              <Select value={pkgForm.network} onValueChange={v => setPkgForm({ ...pkgForm, network: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtn">MTN</SelectItem>
                  <SelectItem value="airteltigo_ishare">AT iShare</SelectItem>
                  <SelectItem value="airteltigo_bigtime">AT BigTime</SelectItem>
                  <SelectItem value="telecel">Telecel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Size (GB)</Label><Input type="number" step="0.1" required value={pkgForm.size_gb} onChange={e => setPkgForm({ ...pkgForm, size_gb: e.target.value })} /></div>
            <div><Label>Price (₵)</Label><Input type="number" step="0.01" required value={pkgForm.price} onChange={e => setPkgForm({ ...pkgForm, price: e.target.value })} /></div>
            <Button type="submit" className="sm:col-span-5 font-semibold">Add to Store</Button>
          </form>
        </Card>

        <Card className="p-0 overflow-hidden">
          {packages.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No packages yet — add your first bundle above.</div>
          ) : (
            <ul className="divide-y divide-border">
              {packages.map(p => (
                <li key={p.id} className="p-4 flex justify-between items-center gap-4">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.size_gb}GB · {labelFor(p.network)} · ₵{Number(p.price).toFixed(2)}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removePackage(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
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
