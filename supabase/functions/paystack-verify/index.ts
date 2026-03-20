import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Plan limits matching the frontend
const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  pro: 3,
  premium: 6,
};

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    const { reference } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Reference is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying payment for user ${userId}, reference: ${reference}`);

    // Verify transaction with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
      },
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack verification response:", JSON.stringify(paystackData));

    if (!paystackData.status || paystackData.data.status !== "success") {
      console.error("Payment not verified:", paystackData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Payment not verified" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { metadata } = paystackData.data;
    const plan = metadata?.plan;
    const referralCode = metadata?.referral_code;

    // Verify the payment belongs to this user
    if (metadata?.user_id !== userId) {
      console.error(`User mismatch: expected ${userId}, got ${metadata?.user_id}`);
      return new Response(
        JSON.stringify({ error: "Payment verification failed - user mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to update profile
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Calculate subscription end date (1 month from now)
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    // Determine verification based on plan — both Pro and Premium get verified, but only Premium gets golden badge
    const isPremium = plan === "premium";
    const isPro = plan === "pro";

    // Update user profile with verified status and new limits
    // IMPORTANT: Use adminClient to bypass RLS for this update
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        plan: plan,
        is_verified: isPremium || isPro, // Both Pro and Premium get verified
        listings_count: 0, // Reset listings count for new period
        subscription_expires_at: subscriptionEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For premium users, feature all their existing listings
    if (isPremium) {
      const { error: featureError } = await adminClient
        .from("listings")
        .update({ is_featured: true })
        .eq("user_id", userId);

      if (featureError) {
        console.error("Error featuring listings:", featureError);
      } else {
        console.log(`Featured all listings for premium user ${userId}`);
      }
    }

    // Record referral commission if referral code was used
    if (referralCode) {
      const { data: ambData } = await adminClient
        .from("ambassadors")
        .select("id, user_id")
        .eq("referral_code", referralCode)
        .eq("status", "approved")
        .maybeSingle();

      if (ambData && ambData.user_id !== userId) {
        const planAmount = plan === "premium" ? 75 : 30;
        const commission = planAmount * 0.5; // 50% commission

        const { error: refError } = await adminClient
          .from("referrals")
          .insert({
            ambassador_id: ambData.id,
            buyer_id: userId,
            package: plan,
            amount: planAmount,
            commission: commission,
            status: "pending",
          });

        if (refError) {
          console.error("Error recording referral:", refError);
        } else {
          console.log(`Referral recorded: ambassador ${ambData.id}, commission GH₵${commission}`);
        }
      }
    }

    console.log(`User ${userId} upgraded to ${plan} via manual verification`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        plan,
        is_verified: isPremium,
        message: `Successfully upgraded to ${plan} plan!${isPremium ? ' You now have a verified badge and all your listings are featured!' : ''}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
