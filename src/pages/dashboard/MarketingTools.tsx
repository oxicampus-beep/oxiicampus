import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Share2, MessageCircle, ExternalLink } from "lucide-react";
import { getStoreUrl, whatsappLink } from "@/lib/store";
import { Navigate } from "react-router-dom";
import { useIsAgent } from "@/hooks/useIsAgent";

const TEMPLATES = (storeName: string, url: string) => [
  `🔥 Cheapest data bundles at ${storeName}! MTN, Telecel & AirtelTigo — instant delivery.\n👉 ${url}`,
  `Need non-expiry data? ${storeName} has the best prices in Ghana.\nShop now: ${url}`,
  `Become my customer on ByteBoss — fast data delivery, trusted service.\n${url}`,
];

export default function MarketingTools() {
  const { user } = useAuth();
  const { isAgent, loading } = useIsAgent();
  const [store, setStore] = useState<{ name: string; slug: string; whatsapp: string } | null>(null);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("stores").select("name, slug, whatsapp").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setStore(data);
          setCustom(TEMPLATES(data.name, getStoreUrl(data.slug))[0]);
        }
      });
  }, [user]);

  if (!loading && !isAgent) return <Navigate to="/dashboard/my-store" replace />;
  if (!store) return <Navigate to="/dashboard/my-store" replace />;

  const url = getStoreUrl(store.slug);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const shareWa = (text: string) => {
    window.open(whatsappLink(store.whatsapp, text), "_blank");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <DashboardPageHeader title="Marketing Tools" description="Promote your store with ready-made messages and share links." badge="Agent" />

      <GlassCard title="Store link">
        <div className="flex flex-wrap gap-2">
          <code className="flex-1 text-xs bg-black/30 rounded-lg p-3 break-all">{url}</code>
          <Button variant="outline" size="icon" onClick={() => copy(url)}><Copy className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" asChild><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
        </div>
      </GlassCard>

      <GlassCard title="Message templates">
        <ul className="space-y-3">
          {TEMPLATES(store.name, url).map((t, i) => (
            <li key={i} className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
              <p className="text-sm whitespace-pre-wrap mb-3">{t}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="gap-1" onClick={() => copy(t)}><Copy className="h-3 w-3" /> Copy</Button>
                <Button size="sm" className="gap-1" onClick={() => shareWa(t)}><MessageCircle className="h-3 w-3" /> WhatsApp</Button>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard title="Custom broadcast">
        <Textarea value={custom} onChange={e => setCustom(e.target.value)} className="min-h-[120px] mb-3" />
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => shareWa(custom)}><Share2 className="h-4 w-4" /> Share on WhatsApp</Button>
          <Button variant="outline" onClick={() => copy(custom)}><Copy className="h-4 w-4" /></Button>
        </div>
      </GlassCard>
    </div>
  );
}
