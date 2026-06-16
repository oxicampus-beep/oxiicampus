import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fulfillOrder, adminClient } from "../_shared/fulfill-order.ts";

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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ success: false, error: "Unauthorized" }, 401);

    const { order_id } = await req.json();
    if (!order_id) return json({ success: false, error: "order_id required" }, 400);

    const admin = adminClient();

    const { data: order } = await admin
      .from("data_orders")
      .select("user_id")
      .eq("id", order_id)
      .single();

    if (!order) return json({ success: false, error: "Order not found" }, 404);

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (order.user_id !== user.id && !roleRow) {
      return json({ success: false, error: "Forbidden" }, 403);
    }

    const result = await fulfillOrder(admin, order_id);
    if (!result.success) {
      return json({ success: false, error: result.error }, result.status);
    }

    return json({
      success: true,
      order_id: result.order_id,
      provider_order_id: result.provider_order_id,
      status: result.status,
      swift_status: result.provider_status,
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
