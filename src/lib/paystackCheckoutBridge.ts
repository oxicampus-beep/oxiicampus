import type { PaystackVerifyResult } from "@/lib/paystack";

export type PaystackCheckoutOpenArgs = {
  reference: string;
  amount: number;
  onSuccess?: (result: PaystackVerifyResult) => void | Promise<void>;
};

type OpenHandler = (args: PaystackCheckoutOpenArgs) => Promise<void>;

let handler: OpenHandler | null = null;

export function setPaystackCheckoutHandler(fn: OpenHandler | null) {
  handler = fn;
}

export function openPaystackCheckout(args: PaystackCheckoutOpenArgs): Promise<void> {
  if (!handler) {
    throw new Error("Payment UI is not ready. Please refresh and try again.");
  }
  return handler(args);
}
