import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { paystackVerify, verifyPaystackWebhookSignature } from "../_shared/paystack.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!paystackSecret) {
      return new Response("Paystack not configured", { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const valid = await verifyPaystackWebhookSignature(paystackSecret, rawBody, signature);
    if (!valid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (event.event !== "charge.success") {
      return new Response("OK", { status: 200 });
    }

    const reference = event.data?.reference as string | undefined;
    if (!reference) {
      return new Response("No reference", { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: payment } = await admin
      .from("paystack_payments")
      .select("reference, status, amount")
      .eq("reference", reference)
      .maybeSingle();

    if (!payment) {
      console.warn("Webhook for unknown reference:", reference);
      return new Response("OK", { status: 200 });
    }

    if (payment.status === "success") {
      return new Response("OK", { status: 200 });
    }

    const verified = await paystackVerify(paystackSecret, reference);
    if (!verified.status || verified.data.status !== "success") {
      return new Response("Not paid", { status: 200 });
    }

    const paidGhs = verified.data.amount / 100;
    if (Math.abs(paidGhs - Number(payment.amount)) > 0.01) {
      console.error("Amount mismatch for", reference);
      return new Response("Amount mismatch", { status: 400 });
    }

    const { error } = await admin.rpc("fulfill_paystack_payment", {
      p_reference: reference,
      p_paystack_data: verified.data,
    });

    if (error) {
      console.error("Fulfill error:", error);
      return new Response(error.message, { status: 500 });
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Internal error", { status: 500 });
  }
});
