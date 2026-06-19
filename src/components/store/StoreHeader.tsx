import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import StoreThemeToggle from "@/components/store/StoreThemeToggle";
import { useStoreTheme } from "@/components/store/StoreThemeProvider";
import { cn } from "@/lib/utils";

type Props = {
  storeName: string;
  storeSlug?: string;
  showSubAgentLink?: boolean;
  onTrackOrder?: () => void;
};

export default function StoreHeader({ storeName, storeSlug, showSubAgentLink = true, onTrackOrder }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark } = useStoreTheme();
  const subAgentHref = storeSlug ? `/store/${storeSlug}/sub-agent` : undefined;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b backdrop-blur-md",
        isDark ? "border-white/10 bg-zinc-950/90" : "border-zinc-200/80 bg-white/90",
      )}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link to={storeSlug ? `/store/${storeSlug}` : "#"} className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "h-9 w-9 rounded-xl grid place-items-center font-black text-lg shrink-0",
              isDark ? "bg-primary text-primary-foreground" : "bg-zinc-900 text-[#FFCC00]",
            )}
          >
            {storeName.charAt(0).toUpperCase()}
          </div>
          <span className={cn("font-display font-bold truncate", isDark ? "text-white" : "text-zinc-900")}>
            {storeName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {showSubAgentLink && subAgentHref && (
            <Button asChild variant="ghost" size="sm" className={cn("gap-1.5 font-semibold", isDark ? "text-primary hover:text-primary" : "text-primary")}>
              <Link to={subAgentHref}>
                <UserPlus className="h-4 w-4" />
                Become sub-agent
              </Link>
            </Button>
          )}
          {onTrackOrder && (
            <Button
              variant="ghost"
              size="sm"
              className={isDark ? "text-zinc-300 hover:text-white" : "text-zinc-600"}
              onClick={onTrackOrder}
            >
              Track order
            </Button>
          )}
          <StoreThemeToggle />
        </nav>

        <div className="flex md:hidden items-center gap-1">
          {showSubAgentLink && subAgentHref && (
            <Button asChild size="sm" variant="outline" className="h-8 px-2 text-xs font-bold gap-1">
              <Link to={subAgentHref}>
                <UserPlus className="h-3.5 w-3.5" />
                Join
              </Link>
            </Button>
          )}
          <StoreThemeToggle />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={isDark ? "text-zinc-300" : "text-zinc-700"}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className={cn("w-72", isDark && "bg-zinc-900 border-white/10")}>
              <SheetHeader>
                <SheetTitle className="text-left font-display">{storeName}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {showSubAgentLink && subAgentHref && (
                  <Button asChild variant="default" className="justify-start gap-2">
                    <Link to={subAgentHref} onClick={() => setMenuOpen(false)}>
                      <UserPlus className="h-4 w-4" />
                      Become a sub-agent
                    </Link>
                  </Button>
                )}
                {onTrackOrder && (
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => { onTrackOrder(); setMenuOpen(false); }}
                  >
                    Track order
                  </Button>
                )}
                <Button asChild variant="outline" className="justify-start">
                  <Link to={storeSlug ? `/store/${storeSlug}` : "#"} onClick={() => setMenuOpen(false)}>
                    Browse bundles
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
