import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Tag, CheckCircle, XCircle } from "lucide-react";

interface ReferralCodeDialogProps {
  open: boolean;
  onClose: (referralCode: string | null) => void;
}

const ReferralCodeDialog = ({ open, onClose }: ReferralCodeDialogProps) => {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<"valid" | "invalid" | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) return;
    setIsValidating(true);
    setValidationResult(null);

    try {
      const { data, error } = await supabase
        .from("ambassadors")
        .select("id, referral_code, status")
        .eq("referral_code", code.trim().toUpperCase())
        .eq("status", "approved")
        .maybeSingle();

      if (data) {
        setValidationResult("valid");
      } else {
        setValidationResult("invalid");
      }
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
    <Dialog open={open} onOpenChange={() => onClose(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Do you have a referral code?
          </DialogTitle>
          <DialogDescription>
            If a Campus Ambassador shared a code with you, enter it below. This is optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="referral-code">Referral Code</Label>
            <div className="flex gap-2">
              <Input
                id="referral-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setValidationResult(null);
                }}
                placeholder="e.g. A4X9K2"
                className="font-mono tracking-widest text-lg"
                maxLength={6}
              />
              <Button
                variant="outline"
                onClick={handleValidate}
                disabled={!code.trim() || isValidating}
              >
                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </Button>
            </div>
            {validationResult === "valid" && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Valid referral code!
              </p>
            )}
            {validationResult === "invalid" && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Invalid or expired code. Please check and try again.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleSkip} className="sm:order-1">
            Continue without code
          </Button>
          <Button
            variant="hero"
            onClick={handleSubmit}
            disabled={validationResult !== "valid"}
            className="sm:order-2"
          >
            Apply Code & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralCodeDialog;
