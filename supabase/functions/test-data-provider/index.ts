import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { testDatamaxConnection } from "../_shared/datamax.ts";
import { fetchSwiftPlans } from "../_shared/swiftdata.ts";

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ success: false, error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ success: false, error: "Admin only" }, 403);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const provider = body.provider === "datamax" ? "datamax" : "swiftdata";

    if (provider === "datamax") {
      const apiKey = Deno.env.get("DATAMAX_API_KEY");
      if (!apiKey) return json({ success: false, error: "DATAMAX_API_KEY not configured" }, 500);
      const result = await testDatamaxConnection(apiKey);
      return json({
        provider: "datamax",
        ...result,
      }, result.http_status === 200 ? 200 : 502);
    }

    const swiftKey = Deno.env.get("SWIFTDATA_API_KEY");
    if (!swiftKey) return json({ success: false, error: "SWIFTDATA_API_KEY not configured" }, 500);
    const plans = await fetchSwiftPlans(swiftKey);
    return json({
      provider: "swiftdata",
      success: true,
      http_status: 200,
      plans_count: plans.length,
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
