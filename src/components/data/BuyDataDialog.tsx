import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

type Pkg = { id: string; network: any; size_gb: number; price: number; validity: string };

export default function BuyDataDialog({ pkg, open, onOpenChange, onSuccess }: {
  pkg: Pkg | null; open: boolean; onOpenChange: (o: boolean) => void; onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) { setPhone(""); setStep("enter"); } }, [open]);

  if (!pkg) return null;
  const balance = Number(profile?.wallet_balance ?? 0);
  const insufficient = balance < Number(pkg.price);

  const handlePay = async () => {
    if (!user) return;
    if (insufficient) return toast.error("Insufficient wallet balance. Top up first.");
    setLoading(true);
    const { error } = await supabase.rpc("purchase_data_package", {
      p_package_id: pkg.id,
      p_recipient_phone: phone,
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("Insufficient")) return toast.error("Insufficient wallet balance. Top up first.");
      return toast.error(error.message);
    }
    toast.success("Purchase successful!");
    await refresh();
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{pkg.size_gb}GB · {labelFor(pkg.network)}</DialogTitle>
          <DialogDescription>Valid for {pkg.validity}. Amount: <span className="font-bold text-primary">₵{Number(pkg.price).toFixed(2)}</span></DialogDescription>
        </DialogHeader>

        {step === "enter" ? (
          <div className="space-y-4 py-2">
            <div>
              <Label>Recipient phone number</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="0241234567" inputMode="numeric" />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button disabled={phone.length < 10} onClick={() => setStep("confirm")}>Continue</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-secondary/60 p-4 space-y-2 text-sm">
              <Row k="Network" v={labelFor(pkg.network)} />
              <Row k="Bundle" v={`${pkg.size_gb}GB`} />
              <Row k="Recipient" v={phone} />
              <Row k="Amount" v={`₵${Number(pkg.price).toFixed(2)}`} highlight />
              <Row k="Wallet balance" v={`₵${balance.toFixed(2)}`} />
            </div>
            {insufficient && (
              <p className="text-destructive text-sm">
                Insufficient balance.{" "}
                <Link to="/dashboard/wallet" className="underline font-medium" onClick={() => onOpenChange(false)}>Top up wallet</Link>
              </p>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("enter")}>Back</Button>
              <Button disabled={loading || insufficient} onClick={handlePay} className="font-semibold gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Processing…" : `Pay ₵${Number(pkg.price).toFixed(2)}`}
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
