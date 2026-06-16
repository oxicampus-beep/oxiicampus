import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, BookOpen, ExternalLink, Key } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = "https://byteboss.shop/api/v1";

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
    setLabel("");
    load();
    toast.success("API key created — copy it now, you won't see it again elsewhere.");
  };

  const remove = async (id: string) => {
    await supabase.from("api_keys").delete().eq("id", id);
    load();
    toast.success("API key revoked");
  };

  const copy = (k: string) => {
    navigator.clipboard.writeText(k);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Developer API</h1>
          <p className="text-muted-foreground mt-1">
            Connect your apps to ByteBoss and sell data bundles programmatically.
          </p>
        </div>
        <Button variant="outline" asChild className="gap-2 shrink-0">
          <Link to="/api-docs">
            <BookOpen className="h-4 w-4" /> API Documentation
          </Link>
        </Button>
      </div>

      <Card className="p-5 space-y-3 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Key className="h-4 w-4" /> API Base URL
        </div>
        <code className="block text-sm font-mono break-all">{BASE_URL}</code>
        <p className="text-xs text-muted-foreground">
          Authenticate with <code className="bg-background px-1 rounded">Authorization: Bearer YOUR_KEY</code> or{" "}
          <code className="bg-background px-1 rounded">X-API-Key: YOUR_KEY</code>
        </p>
        <Button variant="link" className="h-auto p-0 text-primary" asChild>
          <a href={`${BASE_URL}/health`} target="_blank" rel="noopener noreferrer" className="gap-1 inline-flex items-center text-sm">
            <ExternalLink className="h-3.5 w-3.5" /> Check API health
          </a>
        </Button>
      </Card>

      <Card className="p-6 flex gap-3 items-end">
        <div className="flex-1">
          <Label>Key label</Label>
          <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="My website" />
        </div>
        <Button onClick={create} disabled={!label} className="font-semibold">Generate Key</Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            No API keys yet. Generate one to get started.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {keys.map(k => (
              <li key={k.id} className="p-4 flex justify-between items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{k.label}</span>
                    {!k.active && <Badge variant="destructive" className="text-xs">Disabled</Badge>}
                  </div>
                  <code className="text-xs text-muted-foreground break-all block mt-1">{k.api_key}</code>
                  <div className="text-xs text-muted-foreground mt-1">
                    Created {new Date(k.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => copy(k.api_key)} title="Copy key">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(k.id)} title="Revoke key">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 text-sm text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">Quick test</p>
        <pre className="bg-secondary/60 rounded-lg p-3 text-xs overflow-x-auto font-mono">
{`curl "${BASE_URL}/balance" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        </pre>
        <Button variant="outline" size="sm" onClick={() => copy(`curl "${BASE_URL}/balance" -H "Authorization: Bearer YOUR_API_KEY"`)}>
          <Copy className="h-3.5 w-3.5 mr-1" /> Copy curl example
        </Button>
      </Card>
    </div>
  );
}
