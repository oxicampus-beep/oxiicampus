import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import {
  detectGhanaNetwork,
  isValidGhanaMoMoPhone,
  normalizeGhanaPhone,
  type GhanaNetwork,
} from "@/lib/ghanaNetwork";
import type { PaystackVerifyResult } from "@/lib/paystack";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Loader2,
  Phone,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";

export type CheckoutSession = {
  open: boolean;
  reference: string;
  amount: number;
  email: string;
  onSuccess?: (result: PaystackVerifyResult) => void | Promise<void>;
  onComplete: (result: PaystackVerifyResult) => void | Promise<void>;
  onClose: () => void;
};

type Step = "phone" | "otp" | "waiting" | "verifying" | "success" | "failed";

type ChargeResult = {
  success: boolean;
  charge_status?: string;
  display_text?: string;
  error?: string;
  success?: boolean;
  purpose?: string;
  order_id?: string;
  data_order_id?: string;
  job_id?: string;
  balance?: number;
};

export default function ByteBossMoMoCheckout({
  open,
  reference,
  amount,
  email,
  onComplete,
  onClose,
}: CheckoutSession) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<GhanaNetwork | null>(null);
  const [otp, setOtp] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("phone");
    setPhone("");
    setNetwork(null);
    setOtp("");
    setDisplayText("");
    setError("");
    setLoading(false);
  }, [open, reference]);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    const normalized = normalizeGhanaPhone(phone);
    setNetwork(detectGhanaNetwork(normalized));
  }, [phone]);

  const invokeCharge = async (body: Record<string, unknown>): Promise<ChargeResult> => {
    const data = await invokeEdgeFunction<ChargeResult>("paystack-charge", body);
    if (data?.error && data.charge_status === "failed") {
      throw new Error(data.error);
    }
    return data;
  };

  const handleChargeStatus = (result: ChargeResult) => {
    const status = result.charge_status ?? "failed";
    const text = result.display_text ?? "";

    if (status === "success") {
      if (!result.success) {
        setError(result.error ?? "Payment received but could not be completed. Contact support.");
        setStep("failed");
        return;
      }
      setStep("success");
      setTimeout(() => onComplete(result as PaystackVerifyResult), 1200);
      return;
    }

    if (status === "send_otp") {
      setDisplayText(text || "Enter the OTP or voucher code sent to your phone.");
      setStep("otp");
      return;
    }

    if (status === "pay_offline" || status === "pending") {
      setDisplayText(
        text || "Check your phone and approve the payment prompt with your Mobile Money PIN.",
      );
      setStep("waiting");
      startPolling();
      return;
    }

    setError(result.error ?? text ?? "Payment could not be started. Try again.");
    setStep("failed");
  };

  const startPolling = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const result = await invokeCharge({ action: "check_pending", reference });
        if (result.charge_status === "success") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          setStep("success");
          setTimeout(() => onComplete(result as PaystackVerifyResult), 1200);
        } else if (result.charge_status === "send_otp") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          setDisplayText(result.display_text ?? "Enter the OTP sent to your phone.");
          setStep("otp");
        } else if (result.charge_status === "failed") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          setError(result.display_text ?? "Payment failed.");
          setStep("failed");
        }
      } catch {
        /* keep polling */
      }
    }, 10000);
  };

  const startPayment = async () => {
    const normalized = normalizeGhanaPhone(phone);
    if (!isValidGhanaMoMoPhone(normalized) || !network) {
      setError("Enter a valid MTN, Telecel, or AirtelTigo number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await invokeCharge({
        action: "charge",
        reference,
        phone: normalized,
        provider: network.id,
      });
      handleChargeStatus(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setStep("failed");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    if (otp.trim().length < 4) {
      setError("Enter the OTP or voucher code.");
      return;
    }
    setLoading(true);
    setError("");
    setStep("verifying");
    try {
      const result = await invokeCharge({ action: "submit_otp", reference, otp: otp.trim() });
      handleChargeStatus(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP");
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    setStep("phone");
    setError("");
    setOtp("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-primary/20">
        <div className="bg-gradient-to-br from-primary/20 via-background to-background px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/15 grid place-items-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ByteBoss Pay</p>
              <p className="text-2xl font-display font-black text-primary">₵{amount.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Secured by Paystack · Mobile Money</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === "phone" && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Mobile Money number
                </Label>
                <Input
                  inputMode="tel"
                  placeholder="0241234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ""))}
                  className="text-lg font-semibold tracking-wide"
                  autoFocus
                />
              </div>

              {network ? (
                <div className={cn("rounded-xl border px-4 py-3 flex items-center gap-3", network.bgClass, network.borderClass)}>
                  <div
                    className="h-9 w-9 rounded-lg grid place-items-center text-xs font-black"
                    style={{ backgroundColor: network.color, color: network.id === "mtn" ? "#1a1a1a" : "#fff" }}
                  >
                    {network.shortLabel.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{network.label}</p>
                    <p className="text-xs text-muted-foreground">Detected automatically from your number</p>
                  </div>
                </div>
              ) : phone.length >= 3 ? (
                <p className="text-xs text-destructive">Could not detect network — use MTN, Telecel, or AirtelTigo.</p>
              ) : (
                <p className="text-xs text-muted-foreground">We detect MTN, Telecel, or AirtelTigo from your number prefix.</p>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full font-bold h-11"
                disabled={loading || !network}
                onClick={startPayment}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
                Pay ₵{amount.toFixed(2)}
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <p className="text-sm text-muted-foreground">{displayText}</p>
              <div className="space-y-2">
                <Label>OTP / Voucher code</Label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\s/g, ""))}
                  placeholder="Enter code"
                  className="text-center text-xl font-mono tracking-widest"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full font-bold" disabled={loading || otp.length < 4} onClick={submitOtp}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm payment
              </Button>
              <Button variant="ghost" className="w-full" onClick={retry}>Use a different number</Button>
            </>
          )}

          {(step === "waiting" || step === "verifying") && (
            <div className="text-center py-6 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-semibold">{step === "verifying" ? "Verifying code…" : "Waiting for approval"}</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">{displayText}</p>
              </div>
              {network && (
                <p className="text-xs text-muted-foreground">
                  {network.shortLabel} · {normalizeGhanaPhone(phone)}
                </p>
              )}
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto" />
              <p className="text-xl font-display font-bold">Payment successful</p>
              <p className="text-sm text-muted-foreground">₵{amount.toFixed(2)} paid via {network?.shortLabel ?? "Mobile Money"}</p>
            </div>
          )}

          {step === "failed" && (
            <div className="text-center py-6 space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <p className="font-semibold">Payment failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button className="w-full" onClick={retry}>Try again</Button>
            </div>
          )}
        </div>

        <div className="px-6 pb-5">
          <p className="text-[10px] text-center text-muted-foreground">
            Receipt sent to {email}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
