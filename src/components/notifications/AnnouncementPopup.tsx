import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Bell, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Announcement = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "urgent";
  audience: "all" | "users" | "agents";
  created_at: string;
  active?: boolean;
};

const severityStyles = {
  info: {
    icon: Bell,
    ring: "border-primary/40",
    badge: "bg-primary/10 text-primary",
    label: "Notice",
  },
  warning: {
    icon: Megaphone,
    ring: "border-amber-500/40",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    label: "Important",
  },
  urgent: {
    icon: AlertTriangle,
    ring: "border-destructive/40",
    badge: "bg-destructive/10 text-destructive",
    label: "Urgent",
  },
} as const;

export default function AnnouncementPopup() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<Announcement[]>([]);
  const [dismissing, setDismissing] = useState(false);
  const current = queue[0] ?? null;

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("platform_announcements")
      .select("id, title, body, severity, audience, created_at")
      .order("created_at", { ascending: true });
    setQueue((data ?? []) as Announcement[]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();

    const channel = supabase
      .channel("announcement-popups")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "platform_announcements" },
        payload => {
          const row = payload.new as Announcement & { active?: boolean };
          if (row.active === false) return;
          setQueue(prev => (prev.some(a => a.id === row.id) ? prev : [...prev, row]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "platform_announcements" },
        payload => {
          const row = payload.new as Announcement & { active: boolean };
          if (!row.active) {
            setQueue(prev => prev.filter(a => a.id !== row.id));
            return;
          }
          setQueue(prev => {
            if (prev.some(a => a.id === row.id)) return prev;
            return [...prev, row].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            );
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "platform_announcements" },
        payload => {
          const id = (payload.old as { id: string }).id;
          setQueue(prev => prev.filter(a => a.id !== id));
        },
      )
      .subscribe();

    const onFocus = () => { load(); };
    window.addEventListener("focus", onFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, load]);

  const dismiss = async () => {
    if (!current || !user) return;
    setDismissing(true);
    await supabase.from("announcement_dismissals").insert({
      announcement_id: current.id,
      user_id: user.id,
    });
    setDismissing(false);
    setQueue(prev => prev.slice(1));
  };

  if (!current) return null;

  const style = severityStyles[current.severity] ?? severityStyles.info;
  const Icon = style.icon;

  return (
    <Dialog open onOpenChange={open => { if (!open) dismiss(); }}>
      <DialogContent className={cn("sm:max-w-md border-2", style.ring)}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full", style.badge)}>
              {style.label}
            </span>
            {queue.length > 1 && (
              <span className="text-xs text-muted-foreground">{queue.length} messages</span>
            )}
          </div>
          <DialogTitle className="flex items-start gap-3 text-xl font-display">
            <Icon className="h-6 w-6 shrink-0 mt-0.5" />
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-base text-foreground/90 whitespace-pre-wrap pt-2">
            {current.body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={dismiss} disabled={dismissing} className="w-full sm:w-auto font-semibold">
            {dismissing ? "Closing…" : "Got it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
