import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForgotPasswordDialog = ({ open, onOpenChange }: ForgotPasswordDialogProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setEmail("");
      setIsSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">Check your email</DialogTitle>
              <DialogDescription className="text-center mt-2">
                We've sent a password reset link to <strong>{email}</strong>. 
                Click the link in the email to reset your password.
              </DialogDescription>
            </DialogHeader>
            <Button
              variant="hero"
              size="lg"
              className="mt-6 w-full"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Forgot your password?</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === "email" ? "scale-[1.02]" : ""
                  }`}
                >
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      focusedField === "email"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@university.edu.gh"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="pl-12 h-12 rounded-xl border-2 transition-all focus:border-primary focus:shadow-purple"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
