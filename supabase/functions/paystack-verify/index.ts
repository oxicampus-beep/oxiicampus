import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paystackVerify, getPaystackSecret } from "../_shared/paystack.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecret = getPaystackSecret();

    const body = req.method === "POST" ? await req.json() : {};
    const url = new URL(req.url);
    const reference = String(body.reference ?? url.searchParams.get("reference") ?? "").trim();

    if (!reference) {
      return json({ success: false, error: "reference is required" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: payment } = await admin
      .from("paystack_payments")
      .select("reference, status, amount, purpose")
      .eq("reference", reference)
      .maybeSingle();

    if (!payment) {
      return json({ success: false, error: "Payment not found" }, 404);
    }

    if (payment.status === "success") {
      return json({ success: true, already_processed: true, purpose: payment.purpose });
    }

    const verified = await paystackVerify(paystackSecret, reference);
    if (!verified.status || verified.data.status !== "success") {
      await admin.from("paystack_payments").update({ status: "failed" }).eq("reference", reference);
      return json({ success: false, error: "Payment not successful", status: verified.data?.status }, 402);
    }

    const paidGhs = verified.data.amount / 100;
    if (Math.abs(paidGhs - Number(payment.amount)) > 0.01) {
      return json({ success: false, error: "Amount mismatch" }, 400);
    }

    const { data: result, error: fulfillErr } = await admin.rpc("fulfill_paystack_payment", {
      p_reference: reference,
      p_paystack_data: verified.data,
    });

    if (fulfillErr) {
      console.error(fulfillErr);
      return json({ success: false, error: fulfillErr.message }, 500);
    }

    return json({ success: true, ...result });
  } catch (e) {
    console.error(e);
    return json({ success: false, error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
