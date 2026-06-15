import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Store as StoreIcon, Package, ShoppingCart, Banknote } from "lucide-react";
import { Link } from "react-router-dom";

export default function MyStore() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ packages: 0, orders: 0, revenue: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: pCount }, { data: orders }] = await Promise.all([
        supabase.from("store_packages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("store_orders").select("price").eq("store_owner_id", user.id),
      ]);
      setStats({
        packages: pCount ?? 0,
        orders: orders?.length ?? 0,
        revenue: (orders ?? []).reduce((s, o: any) => s + Number(o.price), 0),
      });
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold">My Store</h1>
        <p className="text-muted-foreground mt-1">Resell data under your own brand.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6"><div className="text-sm text-muted-foreground">Packages</div><div className="text-3xl font-display font-bold mt-1">{stats.packages}</div></Card>
        <Card className="p-6"><div className="text-sm text-muted-foreground">Orders</div><div className="text-3xl font-display font-bold mt-1">{stats.orders}</div></Card>
        <Card className="p-6"><div className="text-sm text-muted-foreground">Revenue</div><div className="text-3xl font-display font-bold mt-1 text-primary">₵{stats.revenue.toFixed(2)}</div></Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: "/dashboard/store/packages", icon: Package, label: "Manage Packages" },
          { to: "/dashboard/store/orders", icon: ShoppingCart, label: "View Orders" },
          { to: "/dashboard/store/withdrawal", icon: Banknote, label: "Withdraw Earnings" },
        ].map(l => (
          <Link key={l.to} to={l.to}>
            <Card className="p-6 hover:border-primary/40 transition-colors">
              <l.icon className="h-6 w-6 text-primary mb-2" />
              <div className="font-display font-semibold">{l.label}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
