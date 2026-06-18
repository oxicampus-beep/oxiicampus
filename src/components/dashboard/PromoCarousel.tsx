import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAgent } from "@/hooks/useIsAgent";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  link_url: string | null;
  audience: string;
};

export default function PromoCarousel() {
  const { isAgent } = useIsAgent();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("promo_banners").select("id, title, subtitle, cta_text, link_url, audience")
      .eq("active", true).order("sort_order").then(({ data }) => {
        const ok = (a: string) => a === "all" || (a === "agents" && isAgent) || (a === "users" && !isAgent);
        setBanners((data ?? []).filter(b => ok(b.audience)) as Banner[]);
        setLoading(false);
      });
  }, [isAgent]);

  const next = useCallback(() => setIdx(i => (i + 1) % Math.max(banners.length, 1)), [banners.length]);
  const prev = () => setIdx(i => (i - 1 + banners.length) % Math.max(banners.length, 1));

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [banners.length, next]);

  if (loading) return <div className="w-full aspect-[3/1] rounded-3xl bg-white/5 animate-pulse" />;
  if (!banners.length) return null;

  const b = banners[idx];

  return (
    <div className="relative group rounded-3xl overflow-hidden border border-white/10 shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/10 to-transparent" />
      <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-4 min-h-[140px]">
        <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/30 grid place-items-center shrink-0">
          <Megaphone className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Special Offer</p>
          <h3 className="text-xl md:text-2xl font-display font-black">{b.title}</h3>
          {b.subtitle && <p className="text-sm text-muted-foreground mt-1">{b.subtitle}</p>}
          {b.cta_text && b.link_url && (
            b.link_url.startsWith("/") ? (
              <Link to={b.link_url} className="inline-block mt-3 text-sm font-bold text-primary hover:underline">{b.cta_text} →</Link>
            ) : (
              <a href={b.link_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-bold text-primary hover:underline">{b.cta_text} →</a>
            )
          )}
        </div>
        {banners.length > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/20" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex gap-1">
              {banners.map((_, i) => (
                <button key={i} type="button" onClick={() => setIdx(i)} className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-6 bg-primary" : "w-1.5 bg-white/30")} />
              ))}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/20" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
