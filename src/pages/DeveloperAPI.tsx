import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DeveloperAPI() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [label, setLabel] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("api_keys").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setKeys(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user || !label) return;
    const { error } = await supabase.from("api_keys").insert({ user_id: user.id, label });
    if (error) return toast.error(error.message);
    setLabel(""); load(); toast.success("API key created");
  };

  const remove = async (id: string) => { await supabase.from("api_keys").delete().eq("id", id); load(); };
  const copy = (k: string) => { navigator.clipboard.writeText(k); toast.success("Copied"); };

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h1 className="text-3xl md:text-4xl font-display font-bold">Developer API</h1>
        <p className="text-muted-foreground mt-1">Generate API keys to integrate ByteBoss into your apps.</p></div>

      <Card className="p-6 flex gap-3 items-end">
        <div className="flex-1"><Label>Label</Label><Input value={label} onChange={e => setLabel(e.target.value)} placeholder="My website" /></div>
        <Button onClick={create} disabled={!label} className="font-semibold">Generate Key</Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        {keys.length === 0 ? <div className="p-10 text-center text-muted-foreground">No API keys yet.</div> :
          <ul className="divide-y divide-border">
            {keys.map(k => (
              <li key={k.id} className="p-4 flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{k.label}</div>
                  <code className="text-xs text-muted-foreground break-all">{k.api_key}</code>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => copy(k.api_key)}><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(k.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </li>
            ))}
          </ul>}
      </Card>
    </div>
  );
}
