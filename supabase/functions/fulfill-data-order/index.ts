import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  fetchSwiftPlans,
  matchSwiftPackageId,
  mapSwiftStatusToOrder,
  purchaseSwiftData,
} from "../_shared/swiftdata.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("SWIFTDATA_API_KEY");
    if (!apiKey) {
      return json({ success: false, error: "SWIFTDATA_API_KEY not configured" }, 500);
    }

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

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: order, error: orderErr } = await admin
      .from("data_orders")
      .select("*, data_packages(swift_package_id, size_gb, network)")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) return json({ success: false, error: "Order not found" }, 404);

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!roleRow;
    if (order.user_id !== user.id && !isAdmin) {
      return json({ success: false, error: "Forbidden" }, 403);
    }

    if (order.status === "completed" && order.provider_order_id) {
      return json({ success: true, message: "Already fulfilled", order_id, status: order.status });
    }

    const pkg = order.data_packages as { swift_package_id?: string; size_gb: number; network: string } | null;
    if (!pkg) return json({ success: false, error: "Linked package not found" }, 400);

    const plans = await fetchSwiftPlans(apiKey);
    const swiftPackageId = matchSwiftPackageId(
      order.network,
      Number(order.size_gb),
      plans,
      pkg.swift_package_id,
    );

    if (!swiftPackageId) {
      await admin.from("data_orders").update({
        status: "failed",
        provider_error: "No matching SwiftData plan. Sync plans in admin or set swift_package_id.",
      }).eq("id", order_id);
      return json({
        success: false,
        error: "No matching SwiftData plan for this bundle. Ask admin to sync SwiftData plans.",
      }, 422);
    }

    const swiftRes = await purchaseSwiftData(apiKey, {
      package_id: swiftPackageId,
      phone: order.recipient_phone,
      request_id: order_id,
    });

    if (!swiftRes.success) {
      await admin.from("data_orders").update({
        status: "failed",
        provider_error: swiftRes.error || swiftRes.message || "SwiftData purchase failed",
        provider_status: swiftRes.status ?? "failed",
      }).eq("id", order_id);
      return json({ success: false, error: swiftRes.error || "SwiftData purchase failed" }, 502);
    }

    const mappedStatus = mapSwiftStatusToOrder(swiftRes.status);

    await admin.from("data_orders").update({
      status: mappedStatus,
      provider_order_id: swiftRes.order_id ?? null,
      provider_status: swiftRes.status ?? null,
      provider_error: null,
    }).eq("id", order_id);

    if (!pkg.swift_package_id) {
      await admin.from("data_packages").update({ swift_package_id: swiftPackageId }).eq("id", order.package_id);
    }

    return json({
      success: true,
      order_id,
      provider_order_id: swiftRes.order_id,
      status: mappedStatus,
      swift_status: swiftRes.status,
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
