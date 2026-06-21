import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ByteBossMoMoCheckout, { type CheckoutSession } from "@/components/payment/ByteBossMoMoCheckout";
import { setPaystackCheckoutHandler, type PaystackCheckoutOpenArgs } from "@/lib/paystackCheckoutBridge";
import type { PaystackVerifyResult } from "@/lib/paystack";

type OpenCheckoutArgs = PaystackCheckoutOpenArgs;

type PaystackCheckoutContextValue = {
  openCheckout: (args: OpenCheckoutArgs) => Promise<void>;
};

const PaystackCheckoutContext = createContext<PaystackCheckoutContextValue | null>(null);

export function PaystackCheckoutProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const resolverRef = useRef<{ resolve: () => void; reject: (e: Error) => void } | null>(null);

  const close = useCallback(() => {
    setSession(null);
  }, []);

  const openCheckout = useCallback((args: OpenCheckoutArgs) => {
    return new Promise<void>((resolve, reject) => {
      resolverRef.current = { resolve, reject };
      setSession({
        open: true,
        reference: args.reference,
        amount: args.amount,
        email: args.email,
        onSuccess: args.onSuccess,
        onClose: () => {
          close();
          resolverRef.current?.reject(new Error("Payment cancelled"));
          resolverRef.current = null;
        },
        onComplete: async (result: PaystackVerifyResult) => {
          await args.onSuccess?.(result);
          close();
          resolverRef.current?.resolve();
          resolverRef.current = null;
        },
      });
    });
  }, [close]);

  useEffect(() => {
    setPaystackCheckoutHandler(openCheckout);
    return () => setPaystackCheckoutHandler(null);
  }, [openCheckout]);

  const value = useMemo(() => ({ openCheckout }), [openCheckout]);

  return (
    <PaystackCheckoutContext.Provider value={value}>
      {children}
      {session && <ByteBossMoMoCheckout {...session} />}
    </PaystackCheckoutContext.Provider>
  );
}

export function usePaystackCheckout() {
  const ctx = useContext(PaystackCheckoutContext);
  if (!ctx) throw new Error("usePaystackCheckout must be used within PaystackCheckoutProvider");
  return ctx;
}
