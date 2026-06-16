import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Radio, RotateCw, Loader2 } from "lucide-react";
import { formatCurrency, formatDate, labelFor, statusBadgeClass } from "@/lib/admin";

type Order = {
  id: string;
  user_id: string;
  price: number;
  status: string;
  network: string;
  size_gb: number;
  recipient_phone: string;
  created_at: string;
  provider_order_id?: string | null;
  provider_error?: string | null;
  provider_status?: string | null;
  userName?: string | null;
  userPhone?: string | null;
  userEmail?: string | null;
};

const STATUSES = ["pending", "processing", "completed", "failed", "refunded"] as const;

function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [live, setLive] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const enrich = (raw: Order[], profiles: { id: string; full_name: string | null; phone: string | null; email: string | null }[]) => {
    const map = Object.fromEntries(profiles.map(p => [p.id, p]));
    return raw.map(o => ({
      ...o,
      userName: map[o.user_id]?.full_name,
      userPhone: map[o.user_id]?.phone,
      userEmail: map[o.user_id]?.email,
    }));
  };

  const load = useCallback(async () => {
    const [{ data, error }, { data: profiles }] = await Promise.all([
      supabase.from("data_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, phone, email"),
    ]);
    if (error) return toast.error(error.message);
    setOrders(enrich((data ?? []) as Order[], profiles ?? []));
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "data_orders" }, async (payload) => {
        setLive(true);
        setTimeout(() => setLive(false), 3000);
        const row = payload.new as Order;
        const { data: profile } = await supabase.from("profiles").select("full_name, phone, email").eq("id", row.user_id).maybeSingle();
        setOrders(prev => [{
          ...row,
          userName: profile?.full_name,
          userPhone: profile?.phone,
          userEmail: profile?.email,
        }, ...prev.filter(o => o.id !== row.id)]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "data_orders" }, (payload) => {
        setOrders(prev => prev.map(o => o.id === (payload.new as Order).id ? { ...o, ...(payload.new as Order) } : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("data_orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order status updated");
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const retryFulfillment = async (orderId: string) => {
    setRetryingId(orderId);
    const { data, error } = await supabase.functions.invoke("fulfill-data-order", { body: { order_id: orderId } });
    setRetryingId(null);
    if (error) return toast.error(error.message);
    if (!data?.success) return toast.error(data?.error ?? "Fulfillment failed");
    toast.success(data.status === "completed" ? "Order fulfilled" : "Sent to SwiftData for processing");
    load();
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.recipient_phone.includes(q) ||
      o.userName?.toLowerCase().includes(q) ||
      o.userPhone?.includes(q) ||
      o.userEmail?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl md:text-4xl font-display font-bold">Orders</h1>
            {live && (
              <Badge className="animate-pulse gap-1">
                <Radio className="h-3 w-3" /> New order
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">All platform data orders — updates live when users purchase.</p>
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} of {orders.length} orders</div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone, name, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Bundle</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(o => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.userName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{o.userEmail ?? o.userPhone ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{o.size_gb}GB</div>
                      <div className="text-xs text-muted-foreground">{labelFor(o.network)}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{o.recipient_phone}</TableCell>
                    <TableCell className="font-bold text-primary">{formatCurrency(Number(o.price))}</TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                        <SelectTrigger className={`h-8 w-32 text-xs capitalize ${statusBadgeClass(o.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs max-w-[140px]">
                      {o.provider_order_id ? (
                        <span className="font-mono truncate block" title={o.provider_order_id}>{o.provider_order_id.slice(0, 8)}…</span>
                      ) : o.provider_error ? (
                        <span className="text-destructive truncate block" title={o.provider_error}>{o.provider_error}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(o.created_at)}</TableCell>
                    <TableCell>
                      {(o.status === "processing" || o.status === "failed") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={retryingId === o.id}
                          onClick={() => retryFulfillment(o.id)}
                          title="Retry SwiftData fulfillment"
                        >
                          {retryingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                        </Button>
                      )}
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

export default function AdminOrders() {
  return (
    <AdminGuard>
      <AdminOrdersContent />
    </AdminGuard>
  );
}
