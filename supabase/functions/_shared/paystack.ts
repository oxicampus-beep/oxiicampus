const PAYSTACK_BASE = "https://api.paystack.co";

export type PaystackPurpose =
  | "wallet_topup"
  | "data_purchase"
  | "store_order"
  | "store_activation"
  | "sub_agent_activation"
  | "airtime"
  | "utility"
  | "result_checker"
  | "bulk_purchase";

export async function paystackInitialize(
  secretKey: string,
  params: {
    email: string;
    amountPesewas: number;
    reference: string;
    callbackUrl: string;
    metadata: Record<string, unknown>;
  },
) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountPesewas,
      reference: params.reference,
      callback_url: params.callbackUrl,
      currency: "GHS",
      metadata: params.metadata,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message ?? "Paystack initialize failed");
  }
  return data.data as {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function paystackVerify(secretKey: string, reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "Paystack verify failed");
  }
  return data as {
    status: boolean;
    message: string;
    data: {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at: string | null;
      metadata: Record<string, unknown>;
    };
  };
}

export async function verifyPaystackWebhookSignature(
  secretKey: string,
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hash = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hash === signature;
}

export function generateReference() {
  const id = crypto.randomUUID().replace(/-/g, "");
  return `OXI_${id.slice(0, 20).toUpperCase()}`;
}

export function ghsToPesewas(amountGhs: number) {
  return Math.round(amountGhs * 100);
}

export type ChargeResponse = {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: string;
    display_text?: string;
    message?: string;
    gateway_response?: string;
  };
};

async function paystackPost(secretKey: string, path: string, body?: Record<string, unknown>) {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return data as ChargeResponse;
}

export async function paystackChargeMobileMoney(
  secretKey: string,
  params: {
    email: string;
    amountPesewas: number;
    reference: string;
    phone: string;
    provider: string;
    metadata?: Record<string, unknown>;
  },
) {
  return paystackPost(secretKey, "/charge", {
    email: params.email,
    amount: params.amountPesewas,
    currency: "GHS",
    reference: params.reference,
    metadata: params.metadata ?? {},
    mobile_money: {
      phone: params.phone,
      provider: params.provider,
    },
  });
}

export async function paystackSubmitOtp(secretKey: string, reference: string, otp: string) {
  return paystackPost(secretKey, "/charge/submit_otp", { reference, otp });
}

export async function paystackCheckPendingCharge(secretKey: string, reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/charge/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = await res.json();
  return data as ChargeResponse;
}
