import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SpinWheel from "@/components/gamification/SpinWheel";
import RedeemPointsDialog from "@/components/gamification/RedeemPointsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import {
  REDEEM_POINTS_COST, REFERRAL_POINTS, type RewardsStatus, type SpinResult,
  referralLink, formatNextSpin,
} from "@/lib/rewards";
import { toast } from "sonner";
import { Copy, Gift, Share2, Sparkles, Trophy, Users } from "lucide-react";

export default function Rewards() {
  const { refresh } = useProfile();
  const [status, setStatus] = useState<RewardsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimSpinId, setClaimSpinId] = useState<string | undefined>();
  const [ledger, setLedger] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: s, error }, { data: history }] = await Promise.all([
      supabase.rpc("get_rewards_status"),
      supabase.from("points_ledger").select("*").order("created_at", { ascending: false }).limit(10),
    ]);
    if (error) toast.error(error.message);
    setStatus(s as RewardsStatus);
    setLedger(history ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSpin = async (): Promise<SpinResult> => {
    const { data, error } = await supabase.rpc("spin_wheel");
    if (error) throw new Error(error.message);
    return data as SpinResult;
  };

  const handleSpinComplete = async (result: SpinResult) => {
    if (result.prize_type === "points") {
      toast.success(`You won ${result.points_awarded} points!`);
    } else {
      toast.success(`You won ${result.data_gb}GB data! Claim it below.`);
      setClaimSpinId(result.spin_id);
      setClaimOpen(true);
    }
    await refresh();
    await load();
  };

  const copyReferral = async () => {
    if (!status?.referral_code) return;
    await navigator.clipboard.writeText(referralLink(status.referral_code));
    toast.success("Referral link copied!");
  };

  if (loading && !status) {
    return <div className="text-muted-foreground">Loading rewards…</div>;
  }

  const points = status?.points_balance ?? 0;
  const progress = Math.min(100, (points / REDEEM_POINTS_COST) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Rewards &amp; Gamification
        </h1>
        <p className="text-muted-foreground mt-1">
          Spin the wheel, refer friends, and redeem points for free data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Your Points</span>
          </div>
          <div className="text-3xl font-display font-bold">{points}</div>
          <Progress value={progress} className="mt-3 h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {points >= REDEEM_POINTS_COST
              ? "Ready to redeem 1GB!"
              : `${REDEEM_POINTS_COST - points} more points until 1GB redemption`}
          </p>
          <Button
            className="mt-4 w-full"
            disabled={!status?.can_redeem}
            onClick={() => setRedeemOpen(true)}
          >
            <Gift className="h-4 w-4 mr-2" />
            Redeem {REDEEM_POINTS_COST} pts → 1GB
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Referrals</span>
          </div>
          <div className="text-3xl font-display font-bold">{status?.referrals_count ?? 0}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Earn <strong>{REFERRAL_POINTS} points</strong> for each friend who signs up.
          </p>
          <div className="mt-4 flex gap-2">
            <code className="flex-1 text-xs bg-secondary rounded px-2 py-2 truncate">
              {status?.referral_code ? referralLink(status.referral_code) : "—"}
            </code>
            <Button size="icon" variant="outline" onClick={copyReferral} aria-label="Copy link">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="secondary" className="mt-3 w-full gap-2" onClick={copyReferral}>
            <Share2 className="h-4 w-4" />
            Share referral link
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-3">How it works</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Spin once every <strong>25 days</strong> for points or data</li>
            <li>• Data on the wheel is rare (max <strong>1GB</strong>)</li>
            <li>• Refer friends → <strong>{REFERRAL_POINTS} points</strong> each</li>
            <li>• <strong>{REDEEM_POINTS_COST} points</strong> = 1GB on any network</li>
          </ul>
          {status?.pending_data_spin && (
            <Button
              className="mt-4 w-full"
              variant="default"
              onClick={() => {
                setClaimSpinId(status.pending_data_spin!.spin_id);
                setClaimOpen(true);
              }}
            >
              Claim pending {status.pending_data_spin.data_gb}GB prize
            </Button>
          )}
        </Card>
      </div>

      <Card className="p-6 md:p-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="flex-1 text-center lg:text-left">
            <Badge variant="secondary" className="mb-3">Spin Wheel</Badge>
            <h2 className="text-2xl font-display font-bold mb-2">Try your luck</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              Three prizes on the wheel: 5 points, 15 points, or 1GB data.
              {!status?.can_spin && status?.next_spin_at && (
                <> Next spin: <strong>{formatNextSpin(status.next_spin_at)}</strong>.</>
              )}
            </p>
          </div>
          <SpinWheel
            canSpin={!!status?.can_spin && !status?.pending_data_spin}
            nextSpinAt={status?.next_spin_at ?? null}
            onSpin={handleSpin}
            onSpinComplete={handleSpinComplete}
            disabled={!!status?.pending_data_spin}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-display font-semibold mb-4">Points History</h2>
        {ledger.length === 0 ? (
          <p className="text-sm text-muted-foreground">No points activity yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {ledger.map(row => (
              <li key={row.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <div className="font-medium">{row.description ?? row.source}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </div>
                </div>
                <span className={`font-bold ${row.amount >= 0 ? "text-primary" : "text-destructive"}`}>
                  {row.amount >= 0 ? "+" : ""}{row.amount} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <RedeemPointsDialog
        open={redeemOpen}
        onOpenChange={setRedeemOpen}
        mode="redeem"
        pointsBalance={points}
        onSuccess={async () => { await refresh(); await load(); }}
      />
      <RedeemPointsDialog
        open={claimOpen}
        onOpenChange={setClaimOpen}
        mode="spin_claim"
        spinId={claimSpinId}
        dataGb={status?.pending_data_spin?.data_gb ?? 1}
        pointsBalance={points}
        onSuccess={async () => { await refresh(); await load(); }}
      />
    </div>
  );
}
