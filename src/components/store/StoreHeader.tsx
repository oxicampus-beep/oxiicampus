import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Props = {
  storeName: string;
  onTrackOrder?: () => void;
};

export default function StoreHeader({ storeName, onTrackOrder }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link to="/auth" className="flex items-center gap-2 min-w-0 group">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 grid place-items-center shrink-0">
            <Zap className="h-4 w-4 text-[#FFCC00]" />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="text-sm font-bold text-zinc-900">ByteBoss</span>
            <span className="hidden sm:inline text-zinc-400 mx-1.5">·</span>
            <span className="hidden sm:inline text-sm font-semibold text-zinc-600 truncate">{storeName}</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {onTrackOrder && (
            <Button variant="ghost" size="sm" className="text-zinc-600" onClick={onTrackOrder}>
              Track order
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-zinc-600" asChild>
            <Link to="/auth?mode=signup">Create account</Link>
          </Button>
          <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold" asChild>
            <Link to="/auth">Log in</Link>
          </Button>
        </nav>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-zinc-700">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left font-display">{storeName}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-6">
              {onTrackOrder && (
                <Button variant="outline" className="justify-start" onClick={() => { onTrackOrder(); setMenuOpen(false); }}>
                  Track order
                </Button>
              )}
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/auth?mode=signup" onClick={() => setMenuOpen(false)}>Create account</Link>
              </Button>
              <Button className="justify-start bg-zinc-900" asChild>
                <Link to="/auth" onClick={() => setMenuOpen(false)}>Log in</Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
