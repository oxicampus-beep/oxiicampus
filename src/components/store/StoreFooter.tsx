import { Link } from "react-router-dom";
import { useStoreTheme } from "@/components/store/StoreThemeProvider";
import { cn } from "@/lib/utils";

type Props = {
  storeName: string;
  storeSlug?: string;
  showSubAgentLink?: boolean;
  onTrackOrder?: () => void;
};

export default function StoreFooter({ storeName, storeSlug, showSubAgentLink = true, onTrackOrder }: Props) {
  const { isDark } = useStoreTheme();
  const subAgentHref = storeSlug ? `/store/${storeSlug}/sub-agent` : undefined;

  return (
    <footer className={cn("border-t mt-16", isDark ? "border-white/10 bg-zinc-900/50" : "border-zinc-200 bg-white")}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 gap-10">
          <div>
            <h3 className={cn("font-display font-bold text-lg mb-2", isDark ? "text-white" : "text-zinc-900")}>
              {storeName}
            </h3>
            <p className={cn("text-sm leading-relaxed max-w-sm", isDark ? "text-zinc-400" : "text-zinc-500")}>
              Buy MTN, Telecel and AirtelTigo bundles in seconds. Pay by Mobile Money and get delivery in 1–5 minutes.
            </p>
            <p className={cn("text-xs mt-4", isDark ? "text-zinc-500" : "text-zinc-400")}>Built in Ghana 🇬🇭</p>
          </div>

          <div>
            <h3 className={cn("text-sm font-bold mb-3", isDark ? "text-white" : "text-zinc-900")}>Quick links</h3>
            <ul className={cn("space-y-2 text-sm", isDark ? "text-zinc-400" : "text-zinc-500")}>
              <li>
                <a href="#bundles" className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-zinc-900")}>
                  Browse bundles
                </a>
              </li>
              {showSubAgentLink && subAgentHref && (
                <li>
                  <Link
                    to={subAgentHref}
                    className={cn("transition-colors font-medium", isDark ? "text-primary hover:text-primary/80" : "text-primary hover:underline")}
                  >
                    Become a sub-agent
                  </Link>
                </li>
              )}
              {onTrackOrder && (
                <li>
                  <button
                    type="button"
                    onClick={onTrackOrder}
                    className={cn("transition-colors", isDark ? "hover:text-white" : "hover:text-zinc-900")}
                  >
                    Track an order
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className={cn("mt-10 pt-6 border-t text-xs", isDark ? "border-white/10 text-zinc-500" : "border-zinc-100 text-zinc-400")}>
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
