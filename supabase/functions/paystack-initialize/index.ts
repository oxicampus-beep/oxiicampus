import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateReference,
  getPaystackSecret,
  resolvePaystackEmail,
  type PaystackPurpose,
} from "../_shared/paystack.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PUBLIC_PURPOSES = new Set<PaystackPurpose>(["store_order"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    getPaystackSecret();

    const body = await req.json();
    const purpose = body.purpose as PaystackPurpose;
    const metadata = (body.metadata ?? {}) as Record<string, unknown>;
    const callbackPath = String(body.callback_path ?? "/payment/callback");

    if (!purpose) {
      return json({ success: false, error: "purpose is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl = Deno.env.get("APP_URL") ?? "https://byteboss.shop";

    const admin = createClient(supabaseUrl, serviceKey);
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");

    if (!PUBLIC_PURPOSES.has(purpose)) {
      if (!authHeader?.startsWith("Bearer ")) {
        return json({ success: false, error: "Please sign in to continue" }, 401);
      }
      const token = authHeader.slice(7);
      const { data: { user }, error: userErr } = await admin.auth.getUser(token);
      if (userErr || !user) {
        return json({ success: false, error: "Session expired — please sign in again" }, 401);
      }
      userId = user.id;
      userEmail = user.email ?? null;

      await admin.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: (user.user_metadata?.full_name as string) ?? null,
        phone: (user.user_metadata?.phone as string) ?? null,
      }, { onConflict: "id" });
    }

    const customerEmail = resolvePaystackEmail({
      explicit: body.email as string | undefined,
      userEmail,
      userId,
      phone: (metadata.customer_phone ?? metadata.recipient_phone) as string | undefined,
    });

    const { data: amountGhs, error: quoteErr } = await admin.rpc("quote_paystack_amount", {
      p_purpose: purpose,
      p_metadata: metadata,
      p_user_id: userId,
    });

    if (quoteErr) return json({ success: false, error: quoteErr.message }, 400);

    const amount = Number(amountGhs);
    if (amount <= 0 && purpose !== "store_activation") {
      return json({ success: false, error: "Nothing to pay — use the free action directly" }, 400);
    }

    const reference = generateReference();
    const callbackUrl = `${appUrl.replace(/\/$/, "")}${callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`}?reference=${reference}`;

    const { error: insertErr } = await admin.from("paystack_payments").insert({
      user_id: userId,
      reference,
      amount,
      purpose,
      metadata,
      customer_email: customerEmail,
      status: "pending",
    });

    if (insertErr) {
      console.error(insertErr);
      return json({ success: false, error: "Failed to record payment" }, 500);
    }

    return json({
      success: true,
      reference,
      amount,
      callback_url: callbackUrl,
    });
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
