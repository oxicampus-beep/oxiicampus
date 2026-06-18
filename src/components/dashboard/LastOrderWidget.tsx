import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { labelFor } from "@/components/data/BuyDataDialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Clock, ArrowUpRight } from "lucide-react";
import { GlassCard } from "./DashboardUi";

export default function LastOrderWidget() {
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("data_orders").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setOrder(data));
  }, [user]);

  if (!order) return null;

  const statusColor: Record<string, string> = {
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    processing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 grid place-items-center">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Latest Order</p>
            <p className="font-bold">{order.size_gb}GB {labelFor(order.network)} → {order.recipient_phone}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-black text-primary">₵{Number(order.price).toFixed(2)}</p>
          <Badge variant="outline" className={`mt-1 capitalize text-[10px] ${statusColor[order.status] ?? ""}`}>{order.status}</Badge>
        </div>
      </div>
      <Link to="/dashboard/transactions" className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-4 hover:underline">
        View all transactions <ArrowUpRight className="h-3 w-3" />
      </Link>
    </GlassCard>
  );
}
