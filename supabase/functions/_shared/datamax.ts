export const DATAMAX_BASE = "https://datamax.site/wp-json/api/v1";

export type DatamaxBalanceResponse = {
  success: boolean;
  wallet_balance?: number;
  message?: string;
  error?: string;
};

export type DatamaxPlaceOrderResponse = {
  success: boolean;
  message?: string;
  order_id?: number | string;
  total?: number;
  error?: string;
};

export type DatamaxOrderStatusResponse = {
  success: boolean;
  order_id?: number | string;
  status?: string;
  status_label?: string;
  customer_number?: string;
  network?: string;
  volume?: string;
  total?: string;
  created_at?: string;
  message?: string;
  error?: string;
};

/** Map ByteBoss network enum → Datamax API network values */
export const BYTEBOSS_TO_DATAMAX_NETWORK: Record<string, string> = {
  mtn: "express",
  telecel: "telecel",
  airteltigo_ishare: "airteltigo",
  airteltigo_bigtime: "bigtime",
};

export function datamaxHeaders(apiKey: string): Record<string, string> {
  return {
    "X-API-KEY": apiKey,
    "Content-Type": "application/json",
  };
}

export function mapBytebossNetworkToDatamax(network: string): string | null {
  return BYTEBOSS_TO_DATAMAX_NETWORK[network] ?? null;
}

export function formatDatamaxVolume(sizeGb: number | string): string {
  const n = Number(sizeGb);
  if (!Number.isFinite(n)) return String(sizeGb);
  // Datamax catalog uses whole-GB bundle sizes (e.g. "1", "2", "5")
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 10) / 10);
}

export function datamaxRequestId(orderId: string): string {
  const id = orderId.replace(/-/g, "").slice(0, 20).toUpperCase();
  return `TXN${id}`;
}

export function isDatamaxPlaceSuccess(res: DatamaxPlaceOrderResponse): boolean {
  if (res.success === true) return true;
  const msg = (res.message ?? "").toLowerCase();
  return msg.includes("duplicate request") && res.order_id != null;
}

export function normalizeGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length >= 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("0")) return digits;
  if (digits.length === 9) return `0${digits}`;
  return digits;
}

export async function checkDatamaxBalance(apiKey: string): Promise<DatamaxBalanceResponse & { http_status: number }> {
  const res = await fetch(`${DATAMAX_BASE}/check_balance`, {
    headers: datamaxHeaders(apiKey),
  });
  const json = await res.json().catch(() => ({}));
  return { ...json, http_status: res.status };
}

export async function placeDatamaxOrder(
  apiKey: string,
  params: {
    request_id: string;
    network: string;
    volume: string;
    customer_number: string;
    quantity?: number;
  },
): Promise<DatamaxPlaceOrderResponse & { http_status: number }> {
  const res = await fetch(`${DATAMAX_BASE}/place_order`, {
    method: "POST",
    headers: datamaxHeaders(apiKey),
    body: JSON.stringify({
      request_id: params.request_id,
      network: params.network,
      volume: params.volume,
      customer_number: normalizeGhanaPhone(params.customer_number),
      quantity: params.quantity ?? 1,
    }),
  });
  const json = await res.json().catch(() => ({}));
  return { ...json, http_status: res.status };
}

export async function fetchDatamaxOrderStatus(
  apiKey: string,
  orderId: string | number,
): Promise<DatamaxOrderStatusResponse & { http_status: number }> {
  const res = await fetch(`${DATAMAX_BASE}/order_status?order_id=${encodeURIComponent(String(orderId))}`, {
    headers: datamaxHeaders(apiKey),
  });
  const json = await res.json().catch(() => ({}));
  return { ...json, http_status: res.status };
}

export function mapDatamaxStatusToOrder(status?: string): string {
  const s = (status ?? "").toLowerCase().replace(/_/g, "-");
  if (s.includes("complete") || s.includes("delivered") || s === "success" || s === "done") {
    return "completed";
  }
  if (s.includes("fail") || s.includes("cancel") || s.includes("reject")) {
    return "failed";
  }
  if (s.includes("progress") || s.includes("pending") || s.includes("processing")) {
    return "processing";
  }
  return "processing";
}

export async function testDatamaxConnection(apiKey: string) {
  const res = await checkDatamaxBalance(apiKey);
  return {
    success: res.http_status === 200 && res.success === true,
    http_status: res.http_status,
    wallet_balance: res.wallet_balance ?? null,
    message: res.message ?? res.error ?? null,
  };
}
