import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Tag, CheckCircle, XCircle } from "lucide-react";

interface ReferralCodeDialogProps {
  open: boolean;
  onClose: (referralCode: string | null) => void;
  planName?: string;
  planPrice?: number;
}

const PAYSTACK_FEE_RATE = 0.0195; // 1.95%

const ReferralCodeDialog = ({ open, onClose, planName, planPrice }: ReferralCodeDialogProps) => {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<"valid" | "invalid" | null>(null);

  const paystackFee = planPrice ? Math.ceil(planPrice * PAYSTACK_FEE_RATE * 100) / 100 : 0;
  const totalAmount = planPrice ? planPrice + paystackFee : 0;

  const handleValidate = async () => {
    if (!code.trim()) return;
    setIsValidating(true);
    setValidationResult(null);

    try {
      const { data } = await supabase
        .from("ambassadors")
        .select("id, referral_code, status")
        .eq("referral_code", code.trim().toUpperCase())
        .eq("status", "approved")
        .maybeSingle();

      setValidationResult(data ? "valid" : "invalid");
    } catch {
      setValidationResult("invalid");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = () => {
    if (validationResult === "valid") {
      onClose(code.trim().toUpperCase());
    }
  };

  const handleSkip = () => {
    onClose(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(undefined); }}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] p-5 sm:p-6 gap-4">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Tag className="w-5 h-5 text-primary flex-shrink-0" />
            <span>Do you have a referral code?</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            If a Campus Ambassador shared a code with you, enter it below. This is optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referral-code" className="text-sm font-medium">Referral Code</Label>
            <div className="flex gap-2">
              <Input
                id="referral-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setValidationResult(null);
                }}
                placeholder="e.g. A4X9K2"
                className="font-mono tracking-widest text-base flex-1 min-w-0"
                maxLength={6}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleValidate}
                disabled={!code.trim() || isValidating}
                className="flex-shrink-0 px-3"
              >
                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </Button>
            </div>
            {validationResult === "valid" && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> Valid referral code!
              </p>
            )}
            {validationResult === "invalid" && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="w-4 h-4 flex-shrink-0" /> Invalid or expired code.
              </p>
            )}
          </div>

          {planName && planPrice && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5 text-sm">
              <p className="font-semibold text-foreground">Payment Summary</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{planName} Plan</span>
                <span>GH₵{planPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction fee</span>
                <span>GH₵{paystackFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-1.5 flex justify-between font-semibold">
                <span>Total</span>
                <span>GH₵{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
          <Button variant="ghost" onClick={handleSkip} className="w-full sm:w-auto">
            Continue without code
          </Button>
          <Button
            variant="hero"
            onClick={handleSubmit}
            disabled={validationResult !== "valid"}
            className="w-full sm:w-auto"
          >
            Apply Code & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralCodeDialog;
