import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ADMIN_NAV_FLAT } from "@/lib/admin-nav";
import { Search } from "lucide-react";

export default function AdminCommandPalette({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => { if (!open) setQ(""); }, [open]);

  const items = q
    ? ADMIN_NAV_FLAT.filter(i => i.label.toLowerCase().includes(q.toLowerCase()))
    : ADMIN_NAV_FLAT;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 bg-[#111116] border-white/10 text-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-b border-white/10">
          <Search className="h-4 w-4 text-white/40 shrink-0" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search admin pages…"
            className="border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-white/30"
            autoFocus
          />
          <kbd className="text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-2">
          {items.length === 0 ? (
            <li className="px-4 py-6 text-sm text-white/40 text-center">No pages found</li>
          ) : items.map(item => (
            <li key={item.path}>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-amber-400/10 hover:text-amber-400 transition-colors text-left"
                onClick={() => { navigate(item.path); onOpenChange(false); }}
              >
                <item.icon className="h-4 w-4 text-white/40" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
