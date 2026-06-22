import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ghsToPesewas,
  getPaystackSecret,
  paystackChargeMobileMoney,
  paystackCheckPendingCharge,
  paystackSubmitOtp,
  paystackVerify,
  resolvePaystackEmail,
} from "../_shared/paystack.ts";
import { autoFulfillDataOrder } from "../_shared/fulfill-order.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PUBLIC_PURPOSES = new Set(["store_order"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecret = getPaystackSecret();

    const body = await req.json();
    const action = String(body.action ?? "charge");
    const reference = String(body.reference ?? "").trim();

    if (!reference) {
      return json({ success: false, error: "reference is required" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: payment, error: payErr } = await admin
      .from("paystack_payments")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (payErr || !payment) {
      return json({ success: false, error: "Payment not found" }, 404);
    }

    if (payment.status === "success") {
      return json({ success: true, charge_status: "success", already_paid: true });
    }

    if (!PUBLIC_PURPOSES.has(payment.purpose)) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return json({ success: false, error: "Please sign in to continue" }, 401);
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userErr } = await admin.auth.getUser(token);
      if (userErr || !user || user.id !== payment.user_id) {
        return json({ success: false, error: "Session expired — please sign in again" }, 401);
      }
    }

    if (action === "submit_otp") {
      const otp = String(body.otp ?? "").trim();
      if (!otp) return json({ success: false, error: "OTP is required" }, 400);
      const result = await paystackSubmitOtp(paystackSecret, reference, otp);
      return handleChargeResult(admin, paystackSecret, reference, result);
    }

    if (action === "check_pending") {
      const result = await paystackCheckPendingCharge(paystackSecret, reference);
      return handleChargeResult(admin, paystackSecret, reference, result);
    }

    if (action === "charge") {
      const phone = String(body.phone ?? "").replace(/\D/g, "");
      const provider = String(body.provider ?? "").trim();
      const normalized = phone.startsWith("233") ? "0" + phone.slice(3, 12) : (phone.length === 9 ? "0" + phone : phone.slice(0, 10));

      if (normalized.length !== 10) {
        return json({ success: false, error: "Enter a valid 10-digit mobile money number" }, 400);
      }
      if (!["mtn", "vod", "tgo"].includes(provider)) {
        return json({ success: false, error: "Unsupported mobile money network" }, 400);
      }

      await admin.from("paystack_payments").update({
        metadata: {
          ...(payment.metadata as Record<string, unknown>),
          momo_phone: normalized,
          momo_provider: provider,
        },
      }).eq("reference", reference);

      const result = await paystackChargeMobileMoney(paystackSecret, {
        email: resolvePaystackEmail({
          explicit: payment.customer_email,
          userId: payment.user_id,
          phone: normalized,
        }),
        amountPesewas: ghsToPesewas(Number(payment.amount)),
        reference,
        phone: normalized,
        provider,
        metadata: {
          purpose: payment.purpose,
          user_id: payment.user_id,
          ...(payment.metadata as Record<string, unknown>),
        },
      });

      return handleChargeResult(admin, paystackSecret, reference, result);
    }

    return json({ success: false, error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({
      success: false,
      error: e instanceof Error ? e.message : "Payment failed",
    });
  }
});

async function handleChargeResult(
  admin: ReturnType<typeof createClient>,
  paystackSecret: string,
  reference: string,
  result: { status: boolean; message: string; data?: { status: string; display_text?: string; message?: string; reference?: string } },
) {
  if (!result.status || !result.data) {
    const msg = result.message ?? "Charge failed";
    return json({
      success: false,
      charge_status: "failed",
      error: msg === "Invalid key"
        ? "Payment provider configuration error. Please contact support."
        : msg,
      display_text: msg,
    });
  }

  const chargeStatus = result.data.status ?? "failed";
  const displayText = result.data.display_text ?? result.data.message ?? result.message;
  const chargeReference = result.data.reference ?? reference;

  if (chargeStatus === "success") {
    const verified = await paystackVerify(paystackSecret, chargeReference);
    if (verified.data?.status === "success") {
      const { data: fulfill, error } = await admin.rpc("fulfill_paystack_payment", {
        p_reference: reference,
        p_paystack_data: verified.data,
      });
      if (error) {
        console.error("Fulfill error:", error);
        return json({
          success: false,
          charge_status: "success",
          error: `Payment received but fulfillment failed: ${error.message}. Contact support with ref ${reference}.`,
        });
      }

      const upstream = await autoFulfillDataOrder(admin, fulfill as Record<string, unknown>);
      return json({
        success: true,
        charge_status: "success",
        display_text: displayText,
        ...fulfill,
        ...(upstream?.success
          ? { data_delivery_status: upstream.status, fulfillment_provider: upstream.fulfillment_provider }
          : upstream && !upstream.success
          ? { data_delivery_warning: upstream.error }
          : {}),
      });
    }
  }

  return json({
    success: true,
    charge_status: chargeStatus,
    display_text: displayText,
    message: result.message,
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
