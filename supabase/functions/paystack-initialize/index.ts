import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  plan: "pro" | "premium";
  email: string;
  referral_code?: string | null;
}

const PLAN_BASE_PRICES = {
  pro: 1000, // 10 GHC in pesewas
  premium: 3000, // 30 GHC in pesewas
};

const PAYSTACK_FEE_RATE = 0.0195; // 1.95%

function calculateTotalWithFees(basePesewas: number): number {
  const fee = Math.ceil(basePesewas * PAYSTACK_FEE_RATE);
  return basePesewas + fee;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    const { plan, email, referral_code }: PaymentRequest = await req.json();

    if (!plan || !["pro", "premium"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan selected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = PLAN_PRICES[plan];
    const reference = `oxicampus_${plan}_${userId}_${Date.now()}`;

    // Validate referral code if provided (no self-referral)
    let validReferralCode: string | null = null;
    if (referral_code) {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: ambData } = await adminClient
        .from("ambassadors")
        .select("id, user_id, referral_code")
        .eq("referral_code", referral_code.toUpperCase())
        .eq("status", "approved")
        .maybeSingle();

      if (ambData && ambData.user_id !== userId) {
        validReferralCode = referral_code.toUpperCase();
      }
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        currency: "GHS",
        reference,
        callback_url: `${req.headers.get("origin") || "https://oxiicampus.lovable.app"}/payment-callback`,
        metadata: {
          user_id: userId,
          plan,
          referral_code: validReferralCode,
          custom_fields: [
            {
              display_name: "Plan",
              variable_name: "plan",
              value: plan.charAt(0).toUpperCase() + plan.slice(1),
            },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error("Paystack error:", paystackData);
      return new Response(
        JSON.stringify({ error: paystackData.message || "Payment initialization failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Payment initialized for user ${userId}, plan: ${plan}, reference: ${reference}`);

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error initializing payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
