import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

// Plan limits matching the frontend
const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  pro: 10,
  premium: 50,
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    
    // Verify webhook signature
    const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    const hash = createHmac("sha512", secretKey).update(body).digest("hex");
    
    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event = JSON.parse(body);
    console.log("Paystack webhook received:", event.event);

    if (event.event === "charge.success") {
      const { reference, metadata, customer } = event.data;
      const userId = metadata?.user_id;
      const plan = metadata?.plan;

      if (!userId || !plan) {
        console.error("Missing user_id or plan in metadata");
        return new Response(
          JSON.stringify({ error: "Missing metadata" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create admin client for database operations
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Calculate subscription end date (1 month from now)
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

      // Determine verification and featured status based on plan
      const isPremium = plan === "premium";
      const newListingLimit = PLAN_LIMITS[plan] || 1;

      // Update user profile with new plan, verification, and subscription expiry
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          plan: plan,
          is_verified: isPremium, // Only premium users get verified badge
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
        const { error: featureError } = await supabase
          .from("listings")
          .update({ is_featured: true })
          .eq("user_id", userId);

        if (featureError) {
          console.error("Error featuring listings:", featureError);
        } else {
          console.log(`Featured all listings for premium user ${userId}`);
        }
      }

      console.log(`Successfully upgraded user ${userId} to ${plan} plan (limit: ${newListingLimit} listings)`);
      console.log(`Payment successful - Reference: ${reference}, User: ${userId}, Plan: ${plan}, Email: ${customer?.email}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
