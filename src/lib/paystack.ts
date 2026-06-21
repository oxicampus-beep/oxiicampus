import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import { openPaystackCheckout } from "@/lib/paystackCheckoutBridge";

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

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResult> {
  const data = await invokeEdgeFunction<PaystackVerifyResult>("paystack-verify", { reference });
  if (!data?.success) {
    return { success: false, error: data?.error ?? "Verification failed" };
  }
  return data;
}

export async function initiatePaystackPayment(opts: PaystackInitOptions): Promise<void> {
  const init = await invokeEdgeFunction<{
    success: boolean;
    reference: string;
    amount: number;
    error?: string;
  }>("paystack-initialize", {
    purpose: opts.purpose,
    email: opts.email,
    metadata: opts.metadata,
    callback_path: opts.callbackPath ?? "/payment/callback",
  });

  const { reference, amount } = init;

  sessionStorage.setItem(
    "paystack_pending",
    JSON.stringify({ reference, purpose: opts.purpose, returnPath: window.location.pathname }),
  );

  await openPaystackCheckout({
    reference,
    amount,
    email: opts.email,
    onSuccess: async (result) => {
      sessionStorage.removeItem("paystack_pending");
      await opts.onSuccess?.(result);
    },
  });
}

export function paystackConfigured(): boolean {
  return true;
}
