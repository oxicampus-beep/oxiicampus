import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreTheme } from "@/components/store/StoreThemeProvider";
import { cn } from "@/lib/utils";

type Props = {
  storeName: string;
  onWhatsApp: () => void;
};

export default function StoreHero({ storeName, onWhatsApp }: Props) {
  const { isDark } = useStoreTheme();

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

      <Button
        size="lg"
        className="mt-7 gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-8 h-12 shadow-lg shadow-emerald-500/20"
        onClick={onWhatsApp}
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp us
      </Button>
    </section>
  );
}
