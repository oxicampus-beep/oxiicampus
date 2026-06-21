import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyPaystackPayment } from "@/lib/paystack";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    const reference = params.get("reference");
    if (!reference) {
      setState("error");
      setMessage("Missing payment reference.");
      return;
    }

    (async () => {
      const result = await verifyPaystackPayment(reference);
      const pending = sessionStorage.getItem("paystack_pending");
      let returnPath = "/dashboard";
      if (pending) {
        try {
          const parsed = JSON.parse(pending) as { returnPath?: string; purpose?: string };
          if (parsed.returnPath) returnPath = parsed.returnPath;
        } catch { /* ignore */ }
        sessionStorage.removeItem("paystack_pending");
      }

      if (!result.success) {
        setState("error");
        setMessage(result.error ?? "Payment verification failed.");
        return;
      }

      if (result.data_order_id || result.order_id) {
        const orderId = result.data_order_id ?? result.order_id;
        if (orderId && result.purpose === "data_purchase") {
          await supabase.functions.invoke("fulfill-data-order", { body: { order_id: orderId } });
        }
        if (result.data_order_id && result.purpose === "store_order") {
          await supabase.functions.invoke("fulfill-data-order", { body: { order_id: result.data_order_id } });
        }
      }

      if (result.purpose === "bulk_purchase" && result.job_id) {
        const { data: items } = await supabase
          .from("bulk_disbursement_items")
          .select("data_order_id")
          .eq("job_id", result.job_id)
          .eq("status", "success");
        for (const item of (items ?? []).slice(0, 10)) {
          if (item.data_order_id) {
            await supabase.functions.invoke("fulfill-data-order", { body: { order_id: item.data_order_id } });
          }
        }
      }

      setState("success");
      setMessage(getSuccessMessage(result.purpose));
      toast.success(getSuccessMessage(result.purpose));

      setTimeout(() => navigate(returnPath, { replace: true }), 2500);
    })();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {state === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h1 className="text-xl font-display font-bold">Processing payment</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <h1 className="text-xl font-display font-bold">Payment successful</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="text-xl font-display font-bold">Payment failed</h1>
            <p className="text-muted-foreground text-sm">{message}</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-2">Back to dashboard</Button>
          </>
        )}
      </Card>
    </div>
  );
}

function getSuccessMessage(purpose?: string) {
  switch (purpose) {
    case "wallet_topup": return "Wallet topped up successfully!";
    case "data_purchase": return "Data purchase successful!";
    case "store_order": return "Store order paid — data delivery in progress.";
    case "store_activation": return "Your store is now live!";
    case "sub_agent_activation": return "Sub-agent application submitted!";
    case "airtime": return "Airtime order placed!";
    case "utility": return "Utility payment submitted!";
    case "result_checker": return "Voucher purchase successful!";
    case "bulk_purchase": return "Bulk disbursement started!";
    default: return "Payment completed successfully!";
  }
}
