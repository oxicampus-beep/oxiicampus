import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  fetchSwiftPlans,
  matchSwiftPackageId,
  mapSwiftStatusToOrder,
  purchaseSwiftData,
} from "./swiftdata.ts";

export async function fulfillOrder(admin: SupabaseClient, orderId: string) {
  const swiftKey = Deno.env.get("SWIFTDATA_API_KEY");
  if (!swiftKey) {
    return { success: false as const, error: "SWIFTDATA_API_KEY not configured", status: 500 };
  }

  const { data: order, error: orderErr } = await admin
    .from("data_orders")
    .select("*, data_packages(swift_package_id, size_gb, network)")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return { success: false as const, error: "Order not found", status: 404 };
  }

  if (order.status === "completed" && order.provider_order_id) {
    return {
      success: true as const,
      order_id: orderId,
      status: order.status,
      provider_order_id: order.provider_order_id,
      provider_status: order.provider_status,
    };
  }

  const pkg = order.data_packages as { swift_package_id?: string; size_gb: number; network: string } | null;
  if (!pkg) {
    return { success: false as const, error: "Linked package not found", status: 400 };
  }

  const plans = await fetchSwiftPlans(swiftKey);
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
    }).eq("id", orderId);
    return {
      success: false as const,
      error: "No matching provider plan for this bundle",
      status: 422,
    };
  }

  const swiftRes = await purchaseSwiftData(swiftKey, {
    package_id: swiftPackageId,
    phone: order.recipient_phone,
    request_id: orderId,
  });

  if (!swiftRes.success) {
    await admin.from("data_orders").update({
      status: "failed",
      provider_error: swiftRes.error || swiftRes.message || "Provider purchase failed",
      provider_status: swiftRes.status ?? "failed",
    }).eq("id", orderId);
    return {
      success: false as const,
      error: swiftRes.error || swiftRes.message || "Provider purchase failed",
      status: 502,
    };
  }

  const mappedStatus = mapSwiftStatusToOrder(swiftRes.status);

  await admin.from("data_orders").update({
    status: mappedStatus,
    provider_order_id: swiftRes.order_id ?? null,
    provider_status: swiftRes.status ?? null,
    provider_error: null,
  }).eq("id", orderId);

  if (!pkg.swift_package_id && order.package_id) {
    await admin.from("data_packages").update({ swift_package_id: swiftPackageId }).eq("id", order.package_id);
  }

  return {
    success: true as const,
    order_id: orderId,
    status: mappedStatus,
    provider_order_id: swiftRes.order_id ?? null,
    provider_status: swiftRes.status ?? null,
  };
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
