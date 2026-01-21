import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [plan, setPlan] = useState<string>("");

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get("reference");
      
      if (!reference) {
        setStatus("failed");
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error("Please log in to verify your payment");
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase.functions.invoke("paystack-verify", {
          body: { reference },
        });

        if (error || !data?.success) {
          console.error("Verification error:", error || data);
          setStatus("failed");
          return;
        }

        setPlan(data.plan);
        setStatus("success");
        await refreshProfile();
        toast.success(`Successfully upgraded to ${data.plan} plan!`);
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [searchParams, navigate, refreshProfile]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            <h1 className="font-display text-2xl font-bold">Verifying Payment...</h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold">Payment Successful!</h1>
              <p className="text-muted-foreground">
                You've been upgraded to the <span className="font-semibold text-primary capitalize">{plan}</span> plan.
              </p>
              {plan === "premium" && (
                <p className="text-sm text-accent">
                  🎉 Your account is now verified!
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/create-listing")} variant="hero">
                Create a Listing
              </Button>
              <Button onClick={() => navigate("/profile")} variant="outline">
                View Profile
              </Button>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold">Payment Failed</h1>
              <p className="text-muted-foreground">
                We couldn't verify your payment. Please try again or contact support.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/pricing")} variant="hero">
                Try Again
              </Button>
              <Button onClick={() => navigate("/contact")} variant="outline">
                Contact Support
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
