import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date 3 days from now
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Format dates for comparison (start of day and end of day)
    const startOfDay = new Date(threeDaysFromNow);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(threeDaysFromNow);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Checking for subscriptions expiring between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

    // Find users whose subscriptions expire in exactly 3 days
    const { data: expiringUsers, error: queryError } = await adminClient
      .from("profiles")
      .select("user_id, full_name, plan, subscription_expires_at")
      .gte("subscription_expires_at", startOfDay.toISOString())
      .lte("subscription_expires_at", endOfDay.toISOString())
      .neq("plan", "free");

    if (queryError) {
      console.error("Error querying expiring subscriptions:", queryError);
      throw queryError;
    }

    console.log(`Found ${expiringUsers?.length || 0} users with expiring subscriptions`);

    if (!expiringUsers || expiringUsers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No subscriptions expiring in 3 days",
          count: 0 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user emails from auth.users
    const emailsSent: string[] = [];
    const errors: string[] = [];

    for (const user of expiringUsers) {
      try {
        // Get user email from auth.users
        const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(user.user_id);
        
        if (authError || !authUser?.user?.email) {
          console.error(`Could not get email for user ${user.user_id}:`, authError);
          errors.push(`User ${user.user_id}: Could not get email`);
          continue;
        }

        const email = authUser.user.email;
        const userName = user.full_name || "Valued Customer";
        const planName = user.plan?.charAt(0).toUpperCase() + user.plan?.slice(1) || "Premium";
        const expiryDate = new Date(user.subscription_expires_at).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Send reminder email
        const { error: emailError } = await resend.emails.send({
          from: "OxiCampus <noreply@oxicampus.com>",
          to: [email],
          subject: `Your ${planName} subscription expires in 3 days`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">OxiCampus</h1>
                </div>
                <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <h2 style="color: #1a1a2e; margin-top: 0;">Hi ${userName},</h2>
                  <p style="color: #4a4a4a; line-height: 1.6;">
                    This is a friendly reminder that your <strong style="color: #9b87f5;">${planName} Plan</strong> subscription will expire on <strong>${expiryDate}</strong> - that's just 3 days from now!
                  </p>
                  <p style="color: #4a4a4a; line-height: 1.6;">
                    To continue enjoying your plan benefits including:
                  </p>
                  <ul style="color: #4a4a4a; line-height: 1.8;">
                    ${user.plan === "premium" ? `
                      <li>Unlimited listings per month</li>
                      <li>Gold verified badge</li>
                      <li>Auto-featured listings</li>
                      <li>Priority support</li>
                    ` : `
                      <li>Up to 10 listings per month</li>
                      <li>Extended visibility</li>
                      <li>Standard support</li>
                    `}
                  </ul>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://oxiicampus.lovable.app/pricing" style="display: inline-block; background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Renew My Subscription
                    </a>
                  </div>
                  <p style="color: #888; font-size: 14px; line-height: 1.6;">
                    If you don't renew, your account will revert to the Free plan with limited features. You can always upgrade again anytime!
                  </p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  <p style="color: #888; font-size: 12px; text-align: center; margin-bottom: 0;">
                    © ${new Date().getFullYear()} OxiCampus. All rights reserved.<br>
                    Campus marketplace for students in Ghana.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        if (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
          errors.push(`${email}: ${emailError.message}`);
        } else {
          console.log(`Successfully sent reminder to ${email}`);
          emailsSent.push(email);
        }
      } catch (userError: unknown) {
        const errorMessage = userError instanceof Error ? userError.message : "Unknown error";
        console.error(`Error processing user ${user.user_id}:`, userError);
        errors.push(`User ${user.user_id}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${emailsSent.length} reminder emails`,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Subscription reminder error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
