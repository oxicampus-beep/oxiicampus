import { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { friendlyPasskeyError, isPasskeySupported } from "@/lib/passkey";
import { cn } from "@/lib/utils";

type Props = {
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export function BiometricSignInButton({
  onSuccess,
  disabled,
  className,
  label = "Sign in with biometrics",
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!isPasskeySupported()) return null;

  const handleClick = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPasskey();
    setLoading(false);
    if (error) return toast.error(friendlyPasskeyError(error));
    toast.success("Welcome back!");
    onSuccess?.();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || loading}
        onClick={handleClick}
        className="w-full h-11 font-semibold gap-2 border-border/60 hover:bg-secondary/50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
        {loading ? "Verifying…" : label}
      </Button>
    </div>
  );
}
