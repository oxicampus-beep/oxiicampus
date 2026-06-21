import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateReference,
  ghsToPesewas,
  paystackInitialize,
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173";

    if (!paystackSecret) {
      return json({ success: false, error: "Paystack is not configured" }, 500);
    }

    const body = await req.json();
    const purpose = body.purpose as PaystackPurpose;
    const metadata = (body.metadata ?? {}) as Record<string, unknown>;
    const email = String(body.email ?? "").trim().toLowerCase();
    const callbackPath = String(body.callback_path ?? "/payment/callback");

    if (!purpose || !email || !email.includes("@")) {
      return json({ success: false, error: "purpose and valid email are required" }, 400);
    }

    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");

    if (!PUBLIC_PURPOSES.has(purpose)) {
      if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ success: false, error: "Unauthorized" }, 401);
      userId = user.id;
    }

    const admin = createClient(supabaseUrl, serviceKey);

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

    const payMeta = {
      purpose,
      user_id: userId,
      ...metadata,
    };

    const init = await paystackInitialize(paystackSecret, {
      email,
      amountPesewas: ghsToPesewas(amount),
      reference,
      callbackUrl,
      metadata: payMeta,
    });

    const { error: insertErr } = await admin.from("paystack_payments").insert({
      user_id: userId,
      reference,
      amount,
      purpose,
      metadata,
      customer_email: email,
      status: "pending",
      paystack_access_code: init.access_code,
    });

    if (insertErr) {
      console.error(insertErr);
      return json({ success: false, error: "Failed to record payment" }, 500);
    }

    return json({
      success: true,
      reference,
      amount,
      authorization_url: init.authorization_url,
      access_code: init.access_code,
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
