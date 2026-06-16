export const SWIFTDATA_BASE =
  "https://lsocdjpflecduumopijn.supabase.co/functions/v1/developer-api";

export type SwiftPlan = {
  package_id: string;
  network: string;
  package_size: string;
  api_price?: number;
  is_unavailable?: boolean;
};

export type SwiftBuyResponse = {
  success: boolean;
  order_id?: string;
  status?: string;
  balance?: number;
  error?: string;
  message?: string;
};

/** Map ByteBoss network enum → SwiftData plan network labels */
export const BYTEBOSS_TO_SWIFT_NETWORKS: Record<string, string[]> = {
  mtn: ["YELLO", "MTN"],
  telecel: ["RED", "TELECEL"],
  airteltigo_ishare: ["BLUE", "AT", "AIRTELTIGO", "AT_PREMIUM"],
  airteltigo_bigtime: ["BLUE", "AT", "AIRTELTIGO", "AT_BIGTIME"],
};

export function normalizeGb(size: number | string): number {
  return Math.round(Number(size) * 100) / 100;
}

export function parsePlanGb(packageSize: string): number | null {
  const m = packageSize.trim().match(/^([\d.]+)\s*GB$/i);
  return m ? normalizeGb(m[1]) : null;
}

export function swiftHeaders(apiKey: string, idempotencyKey?: string): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) h["X-Idempotency-Key"] = idempotencyKey;
  return h;
}

export async function fetchSwiftPlans(apiKey: string): Promise<SwiftPlan[]> {
  const res = await fetch(`${SWIFTDATA_BASE}/plans`, {
    headers: swiftHeaders(apiKey),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || "Failed to fetch SwiftData plans");
  }
  return json.plans ?? [];
}

export function matchSwiftPackageId(
  network: string,
  sizeGb: number,
  plans: SwiftPlan[],
  explicitId?: string | null,
): string | null {
  if (explicitId) return explicitId;

  const labels = BYTEBOSS_TO_SWIFT_NETWORKS[network] ?? [];
  const target = normalizeGb(sizeGb);

  const candidates = plans.filter((p) => {
    if (p.is_unavailable) return false;
    const planNet = p.network.toUpperCase();
    if (!labels.some((l) => planNet.includes(l) || l.includes(planNet))) return false;
    const gb = parsePlanGb(p.package_size);
    return gb !== null && gb === target;
  });

  if (candidates.length === 0) return null;
  return candidates[0].package_id;
}

export async function purchaseSwiftData(
  apiKey: string,
  params: { package_id: string; phone: string; request_id: string },
): Promise<SwiftBuyResponse> {
  const res = await fetch(`${SWIFTDATA_BASE}/payment/data`, {
    method: "POST",
    headers: swiftHeaders(apiKey, params.request_id),
    body: JSON.stringify({
      package_id: params.package_id,
      phone: params.phone,
      request_id: params.request_id,
    }),
  });
  return res.json();
}

export function mapSwiftStatusToOrder(status?: string): string {
  switch ((status ?? "").toLowerCase()) {
    case "fulfilled":
      return "completed";
    case "fulfillment_failed":
      return "failed";
    case "processing":
    case "paid":
    case "pending":
      return "processing";
    default:
      return "processing";
  }
}
