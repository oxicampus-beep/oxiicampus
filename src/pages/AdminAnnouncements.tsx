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
import { toast } from "sonner";
import { Bell, Loader2, Send } from "lucide-react";
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
    const { error } = await supabase
      .from("platform_announcements")
      .update({ active: !item.active })
      .eq("id", item.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Notifications" description="Send popup messages to users, agents, or everyone on the platform." />

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
                  <TableHead>Active</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
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
                      <Switch checked={item.active} onCheckedChange={() => toggleActive(item)} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.created_at)}</TableCell>
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
