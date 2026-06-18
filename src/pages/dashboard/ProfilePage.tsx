import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useIsAgent } from "@/hooks/useIsAgent";
import { DashboardPageHeader, GlassCard, DashStatCard } from "@/components/dashboard/DashboardUi";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Mail, Phone, User, Shield, ShoppingBag, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isAgent } = useIsAgent();
  const [orders, setOrders] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("data_orders").select("*", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setOrders(count ?? 0));
  }, [user]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Profile"
        description="Your account overview and quick stats."
        badge={isAgent ? "Agent" : "User"}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DashStatCard icon={Wallet} label="Balance" value={`₵${Number(profile?.wallet_balance ?? 0).toFixed(2)}`} to="/dashboard/wallet" />
        <DashStatCard icon={ShoppingBag} label="Orders" value={String(orders)} />
      </div>

      <GlassCard title="Account Details">
        <dl className="space-y-4">
          <Row icon={User} label="Full name" value={profile?.full_name ?? "—"} />
          <Row icon={Mail} label="Email" value={user?.email ?? "—"} />
          <Row icon={Phone} label="Phone" value={profile?.phone ?? "—"} />
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Shield className="h-4 w-4" /> Account type</span>
            <Badge>{isAgent ? "Agent" : "User"}</Badge>
          </div>
        </dl>
        <Link to="/dashboard/account-settings" className="inline-block mt-6 text-sm font-bold text-primary hover:underline">
          Edit account settings →
        </Link>
      </GlassCard>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}
