import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PackageSearch, Loader2, Radio, Search } from "lucide-react";
import { toast } from "sonner";
import { labelFor } from "@/components/data/BuyDataDialog";
import {
  isValidGhanaPhone,
  normalizePhone,
  orderStatusClass,
  ORDER_STATUS_LABELS,
  type TrackedOrder,
} from "@/lib/orders";

const STORAGE_KEY = "byteboss_tracker_phone";

export default function OrderTrackerFab() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [trackedPhone, setTrackedPhone] = useState<string | null>(null);
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setPhone(saved);
    else if (profile?.phone) setPhone(profile.phone);
  }, [profile?.phone]);

  const fetchOrders = useCallback(async (contact: string, silent = false) => {
    if (!isValidGhanaPhone(contact)) {
      if (!silent) toast.error("Enter a valid 10-digit phone number");
      return;
    }
    if (!silent) setLoading(true);
    const { data, error } = await supabase.rpc("track_orders_by_phone", {
      p_phone: contact,
    });
    if (!silent) setLoading(false);
    if (error) {
      if (!silent) toast.error(error.message);
      return;
    }
    setOrders((data ?? []) as TrackedOrder[]);
    setTrackedPhone(normalizePhone(contact));
    localStorage.setItem(STORAGE_KEY, contact);
  }, []);

  const track = () => fetchOrders(phone);

  useEffect(() => {
    if (!open || !trackedPhone) return;

    fetchOrders(trackedPhone, true);

    const channel = supabase
      .channel(`order-tracker-${trackedPhone}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "data_orders" }, () => {
        setLive(true);
        setTimeout(() => setLive(false), 2500);
        fetchOrders(trackedPhone, true);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "store_orders" }, () => {
        setLive(true);
        setTimeout(() => setLive(false), 2500);
        fetchOrders(trackedPhone, true);
      })
      .subscribe();

    pollRef.current = setInterval(() => fetchOrders(trackedPhone, true), 8000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, trackedPhone, fetchOrders]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 rounded-full shadow-lg shadow-primary/25 gap-2 px-5 font-semibold"
        size="lg"
      >
        <PackageSearch className="h-5 w-5" />
        <span className="hidden sm:inline">Track order</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl flex items-center gap-2">
              <PackageSearch className="h-6 w-6 text-primary" />
              Order tracker
            </SheetTitle>
            <SheetDescription>
              Enter the phone number used when placing your order to see live status updates.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label>Phone number</Label>
              <div className="flex gap-2">
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="0241234567"
                  inputMode="numeric"
                  onKeyDown={e => e.key === "Enter" && track()}
                />
                <Button onClick={track} disabled={loading} className="shrink-0 gap-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Track
                </Button>
              </div>
            </div>
            {user && (
              <p className="text-xs text-muted-foreground">
                Logged in as {profile?.full_name ?? user.email}. We also match orders placed on your account.
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-6">
            {live && (
              <Badge className="mb-3 animate-pulse gap-1">
                <Radio className="h-3 w-3" /> Status updated
              </Badge>
            )}

            {!trackedPhone && !loading && (
              <div className="text-center text-muted-foreground py-12 text-sm">
                Enter your contact number to view orders.
              </div>
            )}

            {trackedPhone && !loading && orders.length === 0 && (
              <div className="text-center text-muted-foreground py-12 text-sm">
                No orders found for {trackedPhone}.
              </div>
            )}

            <ul className="space-y-3">
              {orders.map(o => (
                <li
                  key={`${o.order_type}-${o.order_id}`}
                  className="rounded-xl border border-border p-4 space-y-2 bg-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {Number(o.size_gb)}GB · {labelFor(o.network)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {o.order_type === "store" ? (
                          <>Store order · {o.store_name ?? "Agent store"}</>
                        ) : (
                          <>ByteBoss platform</>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`capitalize shrink-0 ${orderStatusClass(o.status)}`}>
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₵{Number(o.price).toFixed(2)} · {o.contact_phone}</span>
                    <span>{new Date(o.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    Ref: {o.order_id.slice(0, 8)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
