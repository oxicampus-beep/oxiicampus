import { supabase } from "@/integrations/supabase/client";

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

export type PaystackInitOptions = {
  purpose: PaystackPurpose;
  email: string;
  metadata: Record<string, unknown>;
  callbackPath?: string;
  onSuccess?: (result: PaystackVerifyResult) => void | Promise<void>;
};

export type PaystackVerifyResult = {
  success: boolean;
  purpose?: string;
  order_id?: string;
  store_order_id?: string;
  data_order_id?: string;
  job_id?: string;
  balance?: number;
  store_id?: string;
  sub_agent_id?: string;
  already_processed?: boolean;
  error?: string;
};

const PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;

declare global {
  interface Window {
    PaystackPop?: {
      setup: (opts: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

function loadPaystackScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Paystack")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack"));
    document.body.appendChild(script);
  });
}

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResult> {
  const { data, error } = await supabase.functions.invoke("paystack-verify", {
    body: { reference },
  });
  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error ?? "Verification failed" };
  return data as PaystackVerifyResult;
}

export async function initiatePaystackPayment(opts: PaystackInitOptions): Promise<void> {
  if (!PUBLIC_KEY) {
    throw new Error("Paystack public key is not configured (VITE_PAYSTACK_PUBLIC_KEY)");
  }

  const { data: init, error: initErr } = await supabase.functions.invoke("paystack-initialize", {
    body: {
      purpose: opts.purpose,
      email: opts.email,
      metadata: opts.metadata,
      callback_path: opts.callbackPath ?? "/payment/callback",
    },
  });

  if (initErr) throw new Error(initErr.message);
  if (!init?.success) throw new Error(init?.error ?? "Could not start payment");

  const { reference, amount, authorization_url } = init as {
    reference: string;
    amount: number;
    authorization_url: string;
  };

  sessionStorage.setItem(
    "paystack_pending",
    JSON.stringify({ reference, purpose: opts.purpose, returnPath: window.location.pathname }),
  );

  await loadPaystackScript();

  if (window.PaystackPop) {
    return new Promise((resolve, reject) => {
      const handler = window.PaystackPop!.setup({
        key: PUBLIC_KEY,
        email: opts.email,
        amount: Math.round(amount * 100),
        ref: reference,
        currency: "GHS",
        onClose: () => reject(new Error("Payment cancelled")),
        callback: async (response: { reference: string }) => {
          try {
            const result = await verifyPaystackPayment(response.reference);
            if (!result.success) throw new Error(result.error ?? "Verification failed");
            sessionStorage.removeItem("paystack_pending");
            await opts.onSuccess?.(result);
            resolve();
          } catch (e) {
            reject(e);
          }
        },
      });
      handler.openIframe();
    });
  }

  window.location.href = authorization_url;
}

export function paystackConfigured(): boolean {
  return Boolean(PUBLIC_KEY);
}
