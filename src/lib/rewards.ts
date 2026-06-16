export const REDEEM_POINTS_COST = 100;
export const REDEEM_DATA_GB = 1;
export const REFERRAL_POINTS = 10;
export const SPIN_COOLDOWN_DAYS = 25;

export type SpinResult = {
  spin_id: string;
  segment: 0 | 1 | 2;
  prize_type: "points" | "data";
  points_awarded?: number;
  data_gb?: number;
  points_balance: number;
};

export type RewardsStatus = {
  points_balance: number;
  referral_code: string;
  referrals_count: number;
  can_spin: boolean;
  next_spin_at: string | null;
  last_spin_at: string | null;
  pending_data_spin: { spin_id: string; data_gb: number } | null;
  redeem_threshold: number;
  can_redeem: boolean;
};

export const WHEEL_SEGMENTS = [
  { label: "5 Points", color: "#facc15", type: "points" as const },
  { label: "15 Points", color: "#f59e0b", type: "points" as const },
  { label: "1GB Data", color: "#22c55e", type: "data" as const },
];

export function formatNextSpin(nextSpinAt: string | null) {
  if (!nextSpinAt) return null;
  const d = new Date(nextSpinAt);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function referralLink(code: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "https://byteboss.shop";
  return `${base}/auth?ref=${code}`;
}
