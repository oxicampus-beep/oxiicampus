import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Fingerprint, Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  consumePasskeyOfferPending,
  clearPasskeyOfferPending,
  friendlyPasskeyError,
  isPasskeySupported,
  ONBOARDING_COMPLETE_EVENT,
  peekPasskeyOfferPending,
  setPasskeyHint,
} from "@/lib/passkey";

export default function PasskeySetupDialog() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!user || !peekPasskeyOfferPending()) return;
    if (!isPasskeySupported()) {
      clearPasskeyOfferPending();
      return;
    }

    const onDashboard = location.pathname.startsWith("/dashboard");
    const onboardingDone = () => Boolean(localStorage.getItem("byteboss_onboarding_done"));

    const tryOpen = () => {
      if (!peekPasskeyOfferPending()) return;
      if (onDashboard && !onboardingDone()) return;
      if (consumePasskeyOfferPending()) setOpen(true);
    };

    tryOpen();
    window.addEventListener(ONBOARDING_COMPLETE_EVENT, tryOpen);
    return () => window.removeEventListener(ONBOARDING_COMPLETE_EVENT, tryOpen);
  }, [user, location.pathname]);

  const dismiss = () => setOpen(false);

  const enable = async () => {
    setRegistering(true);
    const { error } = await supabase.auth.registerPasskey();
    setRegistering(false);
    if (error) return toast.error(friendlyPasskeyError(error));
    setPasskeyHint(true);
    toast.success("Biometric sign-in enabled!");
    dismiss();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && dismiss()}>
      <DialogContent className="sm:max-w-md border-white/10 bg-[#0A0A0F] text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 grid place-items-center">
            <Fingerprint className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Faster sign-in</p>
            <h2 className="text-xl font-display font-black">Add biometrics?</h2>
          </div>
        </div>
        <p className="text-sm text-white/55 leading-relaxed">
          Use your fingerprint, Face ID, or device PIN to sign in next time — no need to type your password.
        </p>
        <ul className="text-xs text-white/45 space-y-1.5 mt-4">
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            Stored securely on this device only
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            You can remove it anytime in Settings
          </li>
        </ul>
        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
          <Button variant="ghost" onClick={dismiss} className="flex-1 text-white/60 hover:text-white">
            Maybe later
          </Button>
          <Button onClick={enable} disabled={registering} className="flex-1 font-semibold gap-2">
            {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
            {registering ? "Setting up…" : "Enable biometrics"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
