import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StoreOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("store_orders").select("*").eq("store_owner_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl md:text-4xl font-display font-bold">Store Orders</h1>
        <p className="text-muted-foreground mt-1">Orders made through your store.</p></div>
      <Card className="p-0 overflow-hidden">
        {orders.length === 0 ? <div className="p-10 text-center text-muted-foreground">No store orders yet.</div> :
          <ul className="divide-y divide-border">
            {orders.map(o => (
              <li key={o.id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{o.customer_phone}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">₵{Number(o.price).toFixed(2)}</div>
                  <Badge variant="outline" className="mt-1 capitalize text-xs">{o.status}</Badge>
                </div>
              </li>
            ))}
          </ul>}
      </Card>
    </div>
  );
}
