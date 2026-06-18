import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAgent } from "@/hooks/useIsAgent";
import { AlertTriangle, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  link_url: string | null;
  audience: string;
};

export default function PlatformBanners() {
  const { isAgent } = useIsAgent();
  const [maintenance, setMaintenance] = useState<{ on: boolean; message: string | null }>({ on: false, message: null });
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("dismissed_banners");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    (async () => {
      const [{ data: settings }, { data: promos }] = await Promise.all([
        supabase.from("platform_settings").select("maintenance_mode, maintenance_message").eq("id", 1).maybeSingle(),
        supabase.from("promo_banners").select("id, title, subtitle, cta_text, link_url, audience").eq("active", true).order("sort_order"),
      ]);
      if (settings) setMaintenance({ on: settings.maintenance_mode ?? false, message: settings.maintenance_message });
      setBanners((promos ?? []) as Banner[]);
    })();
  }, []);

  const audienceOk = (a: string) => a === "all" || (a === "agents" && isAgent) || (a === "users" && !isAgent);
  const visible = banners.filter(b => audienceOk(b.audience) && !dismissed.has(b.id));

  const dismiss = (id: string) => {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    localStorage.setItem("dismissed_banners", JSON.stringify([...next]));
  };

  if (!maintenance.on && visible.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {maintenance.on && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-600 dark:text-amber-400">Platform maintenance</p>
            <p className="text-muted-foreground mt-0.5">
              {maintenance.message || "Purchases may be temporarily unavailable while we perform updates."}
            </p>
          </div>
        </div>
      )}
      {visible.map(b => (
        <div key={b.id} className="relative flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          <Megaphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 pr-8">
            <p className="font-semibold">{b.title}</p>
            {b.subtitle && <p className="text-muted-foreground mt-0.5">{b.subtitle}</p>}
            {b.cta_text && b.link_url && (
              b.link_url.startsWith("/") ? (
                <Link to={b.link_url} className="inline-block mt-2 text-primary font-medium hover:underline">
                  {b.cta_text}
                </Link>
              ) : (
                <a href={b.link_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-primary font-medium hover:underline">
                  {b.cta_text}
                </a>
              )
            )}
          </div>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => dismiss(b.id)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
