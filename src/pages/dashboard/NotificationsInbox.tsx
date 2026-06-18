import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Badge } from "@/components/ui/badge";
import { Bell, Megaphone, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type InboxItem = {
  id: string;
  title: string;
  body: string;
  severity: string;
  created_at: string;
  is_read: boolean;
};

const severityIcon = { info: Bell, warning: Megaphone, urgent: AlertTriangle };

export default function NotificationsInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_notification_inbox");
      if (!error && data) setItems(data as InboxItem[]);
      else {
        const { data: fallback } = await supabase.from("platform_announcements")
          .select("id, title, body, severity, created_at")
          .eq("active", true)
          .order("created_at", { ascending: false });
        setItems((fallback ?? []).map(a => ({ ...a, is_read: false })));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Inbox Notifications" description="Platform updates, alerts, and announcements." />
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <GlassCard><p className="text-muted-foreground text-sm text-center py-8">No notifications yet.</p></GlassCard>
      ) : (
        <ul className="space-y-3">
          {items.map(n => {
            const Icon = severityIcon[n.severity as keyof typeof severityIcon] ?? Bell;
            return (
              <li key={n.id}>
                <GlassCard className={cn(!n.is_read && "border-primary/30")}>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/5 grid place-items-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold">{n.title}</h3>
                        {!n.is_read && <Badge className="text-[9px] h-4">New</Badge>}
                        <Badge variant="outline" className="text-[9px] capitalize">{n.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.body}</p>
                      <p className="text-xs text-muted-foreground/70 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
