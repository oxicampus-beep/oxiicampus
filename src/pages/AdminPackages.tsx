import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function AdminPackages() {
  const { isAdmin, loading } = useIsAdmin();
  const [items, setItems] = useState<any[]>([]);
  const [f, setF] = useState({ network: "mtn", size_gb: "", price: "", validity: "30 days" });

  const load = async () => {
    const { data } = await supabase.from("data_packages").select("*").order("network").order("size_gb");
    setItems(data ?? []);
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("data_packages").insert({
      network: f.network as any, size_gb: Number(f.size_gb), price: Number(f.price), validity: f.validity,
    });
    if (error) return toast.error(error.message);
    toast.success("Package created"); setF({ network: "mtn", size_gb: "", price: "", validity: "30 days" }); load();
  };

  const toggle = async (p: any) => { await supabase.from("data_packages").update({ active: !p.active }).eq("id", p.id); load(); };
  const remove = async (id: string) => { await supabase.from("data_packages").delete().eq("id", id); load(); };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl md:text-4xl font-display font-bold">Manage Packages</h1>
        <p className="text-muted-foreground mt-1">Admin: create and edit data packages for all networks.</p></div>

      <Card className="p-6">
        <form onSubmit={create} className="grid sm:grid-cols-5 gap-3 items-end">
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
          <div><Label>Validity</Label><Input value={f.validity} onChange={e => setF({ ...f, validity: e.target.value })} /></div>
          <Button type="submit" className="font-semibold">Add</Button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        {items.length === 0 ? <div className="p-10 text-center text-muted-foreground">No packages.</div> :
          <ul className="divide-y divide-border">
            {items.map(p => (
              <li key={p.id} className="p-4 flex justify-between items-center gap-4">
                <div>
                  <div className="font-semibold">{p.size_gb}GB · {p.network}</div>
                  <div className="text-xs text-muted-foreground">₵{Number(p.price).toFixed(2)} · {p.validity}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={p.active} onCheckedChange={() => toggle(p)} />
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </li>
            ))}
          </ul>}
      </Card>
    </div>
  );
}
