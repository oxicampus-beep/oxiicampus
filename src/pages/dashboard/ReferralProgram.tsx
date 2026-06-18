import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Copy, Share2, Users, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import {
  REDEEM_POINTS_COST, REFERRAL_POINTS, type RewardsStatus, referralLink,
} from "@/lib/rewards";

export default function ReferralProgram() {
  const [status, setStatus] = useState<RewardsStatus | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("get_rewards_status");
    setStatus(data as RewardsStatus);
  }, []);

  useEffect(() => { load(); }, [load]);

  const copy = async () => {
    if (!status?.referral_code) return;
    await navigator.clipboard.writeText(referralLink(status.referral_code));
    toast.success("Referral link copied!");
  };

  const points = status?.points_balance ?? 0;
  const progress = Math.min(100, (points / REDEEM_POINTS_COST) * 100);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Referral Program"
        description={`Earn ${REFERRAL_POINTS} points for every friend who signs up with your link.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Referrals</span>
          </div>
          <p className="text-4xl font-display font-black">{status?.referrals_count ?? 0}</p>
          <p className="text-sm text-muted-foreground mt-2">Friends who joined using your link</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3 mb-3">
            <Gift className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your Points</span>
          </div>
          <p className="text-4xl font-display font-black">{points}</p>
          <Progress value={progress} className="mt-3 h-2" />
          <p className="text-xs text-muted-foreground mt-2">{REDEEM_POINTS_COST} pts = 1GB data</p>
        </GlassCard>
      </div>

      <GlassCard title="Your Referral Link">
        <code className="block text-xs bg-black/30 rounded-xl p-4 break-all text-primary/90 mb-4">
          {status?.referral_code ? referralLink(status.referral_code) : "—"}
        </code>
        <div className="flex flex-wrap gap-2">
          <Button onClick={copy} className="gap-2 font-bold"><Copy className="h-4 w-4" /> Copy link</Button>
          <Button variant="secondary" onClick={copy} className="gap-2 font-bold"><Share2 className="h-4 w-4" /> Share</Button>
          <Button variant="outline" asChild><Link to="/dashboard/rewards">Spin wheel & redeem</Link></Button>
        </div>
      </GlassCard>
    </div>
  );
}
