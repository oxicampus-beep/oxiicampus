import { Link } from "react-router-dom";
import { MessageCircle, UserPlus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreTheme } from "@/components/store/StoreThemeProvider";
import { cn } from "@/lib/utils";

type Props = {
  storeName: string;
  storeSlug: string;
  showSubAgentCta?: boolean;
  onWhatsApp: () => void;
  onBrowseBundles?: () => void;
};

export default function StoreHero({ storeName, storeSlug, showSubAgentCta = true, onWhatsApp, onBrowseBundles }: Props) {
  const { isDark } = useStoreTheme();
  const subAgentHref = `/store/${storeSlug}/sub-agent`;

  return (
    <section className="text-center py-10 md:py-14 px-4">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold mb-5",
          isDark
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-emerald-200 bg-emerald-50 text-emerald-700",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Open now
      </div>

      <h1 className={cn("text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>
        {storeName}
      </h1>

      <p className={cn("mt-4 text-base sm:text-lg max-w-lg mx-auto leading-relaxed", isDark ? "text-zinc-400" : "text-zinc-500")}>
        Pick a bundle below. Pay by Mobile Money. Delivered in 1–5 min.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
        <Button
          size="lg"
          className="gap-2 rounded-full font-semibold px-8 h-12 w-full sm:w-auto"
          onClick={onBrowseBundles ?? (() => document.getElementById("bundles")?.scrollIntoView({ behavior: "smooth" }))}
        >
          <ShoppingBag className="h-5 w-5" />
          Browse bundles
        </Button>
        <Button
          size="lg"
          variant="outline"
          className={cn(
            "gap-2 rounded-full font-semibold px-8 h-12 w-full sm:w-auto",
            isDark ? "border-white/20 hover:bg-white/5" : "",
          )}
          onClick={onWhatsApp}
        >
          <MessageCircle className="h-5 w-5 text-[#25D366]" />
          WhatsApp us
        </Button>
      </div>

      {showSubAgentCta && (
        <div
          className={cn(
            "mt-10 max-w-xl mx-auto rounded-2xl border p-5 sm:p-6 text-left",
            isDark ? "border-primary/25 bg-primary/5" : "border-primary/20 bg-primary/[0.03]",
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0", isDark ? "bg-primary/15" : "bg-primary/10")}>
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-display font-bold text-lg", isDark ? "text-white" : "text-zinc-900")}>
                Become a sub-agent
              </p>
              <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-zinc-500")}>
                Get <span className="font-semibold text-primary">cheaper wholesale prices</span> and launch{" "}
                <span className="font-semibold text-primary">your own reseller store</span> under {storeName}.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0 font-bold gap-2 w-full sm:w-auto">
              <Link to={subAgentHref}>
                <UserPlus className="h-4 w-4" />
                Join now
              </Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
