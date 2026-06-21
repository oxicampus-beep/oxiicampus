import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Tag } from "lucide-react";
import { initiatePaystackPayment, paystackConfigured } from "@/lib/paystack";

type Pkg = { id: string; network: any; size_gb: number; price: number; validity: string };

export default function BuyDataDialog({ pkg, open, onOpenChange, onSuccess }: {
  pkg: Pkg | null; open: boolean; onOpenChange: (o: boolean) => void; onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [loading, setLoading] = useState(false);
  const [purchasesEnabled, setPurchasesEnabled] = useState(true);

  useEffect(() => {
    if (open) {
      setPhone("");
      setPromoCode("");
      setDiscount(0);
      setPromoValid(null);
      setStep("enter");
      if (user?.email) setEmail(user.email);
      supabase.from("platform_settings").select("purchases_enabled, maintenance_mode").eq("id", 1).maybeSingle()
        .then(({ data }) => setPurchasesEnabled(!(data?.maintenance_mode) && (data?.purchases_enabled ?? true)));
    }
  }, [open, user?.email]);

  if (!pkg) return null;
  const finalPrice = Math.max(0, Number(pkg.price) - discount);

  const validatePromo = async (code: string) => {
    if (!code.trim()) { setDiscount(0); setPromoValid(null); return; }
    const { data } = await supabase.from("promo_codes").select("*")
      .eq("active", true).ilike("code", code.trim()).maybeSingle();
    if (!data) { setDiscount(0); setPromoValid(false); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setDiscount(0); setPromoValid(false); return; }
    if (data.max_uses != null && data.uses_count >= data.max_uses) { setDiscount(0); setPromoValid(false); return; }
    if (data.network && data.network !== pkg.network) { setDiscount(0); setPromoValid(false); return; }
    if (Number(data.min_order_amount) > Number(pkg.price)) { setDiscount(0); setPromoValid(false); return; }
    const d = data.discount_type === "percent"
      ? Math.round(Number(pkg.price) * Number(data.discount_value) / 100 * 100) / 100
      : Number(data.discount_value);
    setDiscount(Math.min(d, Number(pkg.price)));
    setPromoValid(true);
  };

  const handlePay = async () => {
    if (!user) return;
    if (!purchasesEnabled) return toast.error("Purchases are temporarily disabled.");
    if (!email.includes("@")) return toast.error("Enter a valid email for payment.");
    if (!paystackConfigured()) return toast.error("Paystack is not configured.");

    setLoading(true);
    try {
      await initiatePaystackPayment({
        purpose: "data_purchase",
        email,
        metadata: {
          package_id: pkg.id,
          recipient_phone: phone,
          ...(promoCode.trim() ? { promo_code: promoCode.trim() } : {}),
        },
        onSuccess: async (result) => {
          const orderId = result.order_id;
          if (orderId) {
            const { data: fulfill, error: fulfillErr } = await supabase.functions.invoke("fulfill-data-order", {
              body: { order_id: orderId },
            });
            if (fulfillErr || !fulfill?.success) {
              toast.warning(fulfill?.error ?? "Order placed. Data delivery is pending.");
            } else if (fulfill.status === "completed") {
              toast.success("Purchase successful! Data has been delivered.");
            } else {
              toast.success("Purchase successful! Your data is being delivered.");
            }
          } else {
            toast.success("Purchase successful!");
          }
          onOpenChange(false);
          onSuccess?.();
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{pkg.size_gb}GB · {labelFor(pkg.network)}</DialogTitle>
          <DialogDescription>
            Valid for {pkg.validity}. Amount:{" "}
            <span className="font-bold text-primary">
              ₵{finalPrice.toFixed(2)}
              {discount > 0 && <span className="text-muted-foreground line-through ml-2">₵{Number(pkg.price).toFixed(2)}</span>}
            </span>
          </DialogDescription>
        </DialogHeader>

        {!purchasesEnabled && (
          <p className="text-destructive text-sm rounded-lg bg-destructive/10 p-3">Purchases are currently disabled. Please try again later.</p>
        )}

        {step === "enter" ? (
          <div className="space-y-4 py-2">
            <div>
              <Label>Recipient phone number</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="0241234567" inputMode="numeric" />
            </div>
            <div>
              <Label>Payment email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> Promo code (optional)</Label>
              <Input
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoValid(null); }}
                onBlur={() => validatePromo(promoCode)}
                placeholder="SAVE10"
                className="uppercase"
              />
              {promoValid === true && <p className="text-xs text-green-600 mt-1">Promo applied — you save ₵{discount.toFixed(2)}</p>}
              {promoValid === false && promoCode.trim() && <p className="text-xs text-destructive mt-1">Invalid or expired promo code</p>}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button disabled={phone.length < 10 || !purchasesEnabled || !email.includes("@")} onClick={() => setStep("confirm")}>Continue</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-secondary/60 p-4 space-y-2 text-sm">
              <Row k="Network" v={labelFor(pkg.network)} />
              <Row k="Bundle" v={`${pkg.size_gb}GB`} />
              <Row k="Recipient" v={phone} />
              {discount > 0 && <Row k="Promo discount" v={`-₵${discount.toFixed(2)}`} />}
              <Row k="Amount" v={`₵${finalPrice.toFixed(2)}`} highlight />
            </div>
            <p className="text-xs text-muted-foreground">You will pay securely via Paystack (Mobile Money, card, or bank).</p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("enter")}>Back</Button>
              <Button disabled={loading || !purchasesEnabled} onClick={handlePay} className="font-semibold gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Opening Paystack…" : `Pay ₵${finalPrice.toFixed(2)}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const Row = ({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{k}</span>
    <span className={highlight ? "font-bold text-primary" : "font-medium"}>{v}</span>
  </div>
);

export function labelFor(n: string) {
  return ({ mtn: "MTN", airteltigo_ishare: "AirtelTigo iShare", airteltigo_bigtime: "AirtelTigo BigTime", telecel: "Telecel" } as any)[n] ?? n;
}
