import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Bell, Loader2, Send, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/admin";

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: "all" | "users" | "agents";
  severity: "info" | "warning" | "urgent";
  active: boolean;
  created_at: string;
};

const audienceLabel = { all: "Everyone", users: "Users only", agents: "Agents only" };
const severityLabel = { info: "Info", warning: "Warning", urgent: "Urgent" };

function AdminAnnouncementsContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: "all" as Announcement["audience"],
    severity: "info" as Announcement["severity"],
  });

  const load = async () => {
    const { data, error } = await supabase
      .from("platform_announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return toast.error(error.message);
    setItems((data ?? []) as Announcement[]);
  };

  useEffect(() => { load(); }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return toast.error("Title and message are required.");
    setSending(true);
    const { error } = await supabase.from("platform_announcements").insert({
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience,
      severity: form.severity,
      active: true,
      created_by: user?.id,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Notification sent — recipients will see a popup.");
    setForm({ title: "", body: "", audience: "all", severity: "info" });
    load();
  };

  const toggleActive = async (item: Announcement) => {
    const next = !item.active;
    const { error } = await supabase
      .from("platform_announcements")
      .update({ active: next })
      .eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Notification is live — eligible users will see it." : "Notification turned off — it will no longer appear.");
    load();
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("platform_announcements").delete().eq("id", id);
    setDeletingId(null);
    if (error) return toast.error(error.message);
    toast.success("Notification deleted.");
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications"
        description="Send popup messages to users, agents, or everyone. Turn off or delete to hide them immediately."
      />

      <Card className="p-6">
        <form onSubmit={send} className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">New notification</h2>
              <p className="text-sm text-muted-foreground">Shows as a popup until the recipient dismisses it.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={v => setForm({ ...form, audience: v as Announcement["audience"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone (users + agents)</SelectItem>
                  <SelectItem value="users">Users only (no store)</SelectItem>
                  <SelectItem value="agents">Agents only (store owners)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v as Announcement["severity"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Scheduled maintenance tonight"
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              placeholder="Write your message to users…"
              rows={4}
              maxLength={2000}
              required
            />
          </div>

          <Button type="submit" disabled={sending} className="font-semibold gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send notification
          </Button>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-display font-semibold">Sent notifications</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Off or deleted notifications are hidden from users. Turn on to show again to users who have not dismissed it.</p>
        </div>
        {items.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No notifications sent yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} className={!item.active ? "opacity-60" : undefined}>
                    <TableCell>
                      <div className="font-medium max-w-[200px] truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground max-w-[240px] truncate">{item.body}</div>
                    </TableCell>
                    <TableCell className="text-sm">{audienceLabel[item.audience]}</TableCell>
                    <TableCell>
                      <Badge variant={item.severity === "urgent" ? "destructive" : item.severity === "warning" ? "secondary" : "outline"}>
                        {severityLabel[item.severity]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={item.active} onCheckedChange={() => toggleActive(item)} />
                        <span className="text-xs text-muted-foreground">{item.active ? "On" : "Off"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={deletingId === item.id}>
                            {deletingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete notification?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently removes &quot;{item.title}&quot; and it will no longer appear for any user.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => remove(item.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminAnnouncements() {
  return <AdminAnnouncementsContent />;
}
