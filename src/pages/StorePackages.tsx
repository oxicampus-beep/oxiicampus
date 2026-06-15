import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function StorePackages() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [f, setF] = useState({ name: "", network: "mtn", size_gb: "", price: "" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("store_packages").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    const { error } = await supabase.from("store_packages").insert({
      user_id: user.id, name: f.name, network: f.network as any, size_gb: Number(f.size_gb), price: Number(f.price),
    });
    if (error) return toast.error(error.message);
    toast.success("Package added"); setF({ name: "", network: "mtn", size_gb: "", price: "" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("store_packages").delete().eq("id", id); load();
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl md:text-4xl font-display font-bold">Store Packages</h1>
        <p className="text-muted-foreground mt-1">Create the bundles you sell in your store.</p></div>

      <Card className="p-6">
        <form onSubmit={create} className="grid sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2"><Label>Name</Label><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="MTN 1GB Daily" /></div>
          <div>
            <Label>Network</Label>
            <Select value={f.network} onValueChange={v => setF({ ...f, network: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn">MTN</SelectItem>
                <SelectItem value="airteltigo_ishare">AT iShare</SelectItem>
                <SelectItem value="airteltigo_bigtime">AT BigTime</SelectItem>
                <SelectItem value="telecel">Telecel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Size (GB)</Label><Input type="number" step="0.1" required value={f.size_gb} onChange={e => setF({ ...f, size_gb: e.target.value })} /></div>
          <div><Label>Price (₵)</Label><Input type="number" step="0.01" required value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></div>
          <Button type="submit" className="sm:col-span-5 font-semibold">Add Package</Button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        {items.length === 0 ? <div className="p-10 text-center text-muted-foreground">No packages yet.</div> :
          <ul className="divide-y divide-border">
            {items.map(p => (
              <li key={p.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.size_gb}GB · {p.network} · ₵{Number(p.price).toFixed(2)}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            ))}
          </ul>
        }
      </Card>
    </div>
  );
}
