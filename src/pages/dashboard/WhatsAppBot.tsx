import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bot, MessageCircle, ExternalLink } from "lucide-react";
import { getStoreUrl, whatsappLink } from "@/lib/store";
import { Navigate } from "react-router-dom";
import { useIsAgent } from "@/hooks/useIsAgent";

const DEFAULT_GREETING = (name: string, url: string) =>
  `Hi! Welcome to ${name} 👋\n\nI sell cheap MTN, Telecel & AirtelTigo data bundles with instant delivery.\n\nBrowse packages & order here:\n${url}\n\nReply with your preferred bundle size!`;

export default function WhatsAppBot() {
  const { user } = useAuth();
  const { isAgent, loading } = useIsAgent();
  const [store, setStore] = useState<any>(null);
  const [enabled, setEnabled] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("stores").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setStore(data);
        setEnabled(data.whatsapp_bot_enabled ?? false);
        setGreeting(data.whatsapp_bot_greeting || DEFAULT_GREETING(data.name, getStoreUrl(data.slug)));
      }
    });
  }, [user]);

  if (!loading && !isAgent) return <Navigate to="/dashboard/my-store" replace />;
  if (!store) return <Navigate to="/dashboard/my-store" replace />;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      whatsapp_bot_enabled: enabled,
      whatsapp_bot_greeting: greeting,
    }).eq("id", store.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("WhatsApp bot settings saved");
  };

  const testLink = whatsappLink(store.whatsapp, greeting);

  return (
    <div className="space-y-6 max-w-2xl">
      <DashboardPageHeader title="WhatsApp Bot" description="Auto-greet customers with your store link when they message you." badge="Agent" />

      <GlassCard>
        <div className="flex items-center justify-between mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <p className="font-bold">Bot enabled</p>
              <p className="text-xs text-muted-foreground">Share your wa.me link with this greeting pre-filled</p>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-4">
          <div>
            <Label>Greeting message</Label>
            <Textarea value={greeting} onChange={e => setGreeting(e.target.value)} className="mt-1 min-h-[160px] font-mono text-sm" />
            <p className="text-xs text-muted-foreground mt-1">Customers see this when they tap your WhatsApp order link.</p>
          </div>
          <div>
            <Label>WhatsApp number</Label>
            <Input value={store.whatsapp} disabled className="mt-1" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving} className="font-bold">{saving ? "Saving…" : "Save settings"}</Button>
            <Button variant="secondary" className="gap-2" asChild>
              <a href={testLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Test greeting
              </a>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href={getStoreUrl(store.slug)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> View store
              </a>
            </Button>
          </div>
        </div>
      </GlassCard>

      {enabled && (
        <GlassCard title="How to use">
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Add the test link to your WhatsApp Business away message or status</li>
            <li>Share the link on social media — customers tap and message you with context</li>
            <li>Fulfill orders manually or direct them to your storefront link in the greeting</li>
          </ol>
        </GlassCard>
      )}
    </div>
  );
}
