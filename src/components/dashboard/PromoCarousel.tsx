import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAgent } from "@/hooks/useIsAgent";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Banner = {
  id: string;
  title: string | null;
  link_url: string | null;
  image_url: string;
  audience: string;
};

function BannerImage({ banner, className }: { banner: Banner; className?: string }) {
  const img = (
    <img
      src={banner.image_url}
      alt={banner.title ?? "Promotion"}
      className={cn("w-full aspect-[3/1] object-cover", className)}
      loading="lazy"
    />
  );

  if (!banner.link_url) return img;

  if (banner.link_url.startsWith("/")) {
    return <Link to={banner.link_url} className="block">{img}</Link>;
  }
  return (
    <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
      {img}
    </a>
  );
}

export default function PromoCarousel() {
  const { isAgent } = useIsAgent();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("promo_banners")
      .select("id, title, link_url, image_url, audience")
      .eq("active", true)
      .not("image_url", "is", null)
      .order("sort_order")
      .then(({ data }) => {
        const ok = (a: string) => a === "all" || (a === "agents" && isAgent) || (a === "users" && !isAgent);
        setBanners((data ?? []).filter(b => b.image_url && ok(b.audience)) as Banner[]);
        setIdx(0);
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

  const safeIdx = idx % banners.length;
  const b = banners[safeIdx];
  if (!b) return null;

  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-xl group">
      <BannerImage banner={b} />
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={prev}
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={next}
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </Button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to banner ${i + 1}`}
                onClick={() => setIdx(i)}
                className={cn("h-1.5 rounded-full transition-all", i === safeIdx ? "w-6 bg-primary" : "w-1.5 bg-white/50")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
