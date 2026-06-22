import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  checkDatamaxBalance,
  datamaxRequestId,
  fetchDatamaxOrderStatus,
  formatDatamaxVolume,
  isDatamaxPlaceSuccess,
  mapBytebossNetworkToDatamax,
  mapDatamaxStatusToOrder,
  placeDatamaxOrder,
} from "./datamax.ts";
import {
  fetchSwiftPlans,
  matchSwiftPackageId,
  mapSwiftStatusToOrder,
  purchaseSwiftData,
} from "./swiftdata.ts";

export type FulfillmentProvider = "swiftdata" | "datamax";

type FulfillSuccess = {
  success: true;
  order_id: string;
  status: string;
  provider_order_id: string | null;
  provider_status: string | null;
  fulfillment_provider: FulfillmentProvider;
};

type FulfillFailure = {
  success: false;
  error: string;
  status: number;
};

export async function getFulfillmentProvider(admin: SupabaseClient): Promise<FulfillmentProvider> {
  const { data } = await admin
    .from("platform_settings")
    .select("data_fulfillment_provider")
    .eq("id", 1)
    .maybeSingle();
  const provider = data?.data_fulfillment_provider;
  return provider === "datamax" ? "datamax" : "swiftdata";
}

export async function fulfillOrder(admin: SupabaseClient, orderId: string): Promise<FulfillSuccess | FulfillFailure> {
  const provider = await getFulfillmentProvider(admin);
  if (provider === "datamax") {
    return fulfillDatamaxOrder(admin, orderId);
  }
  return fulfillSwiftOrder(admin, orderId);
}

/** After Paystack creates a data order, send it to the active upstream provider. */
export async function autoFulfillDataOrder(
  admin: SupabaseClient,
  paystackResult: Record<string, unknown>,
): Promise<FulfillSuccess | FulfillFailure | null> {
  const purpose = String(paystackResult.purpose ?? "");
  let dataOrderId: string | null = null;

  if (purpose === "store_order" && paystackResult.data_order_id) {
    dataOrderId = String(paystackResult.data_order_id);
  } else if (purpose === "data_purchase" && paystackResult.order_id) {
    dataOrderId = String(paystackResult.order_id);
  }

  if (!dataOrderId) return null;

  const result = await fulfillOrder(admin, dataOrderId);
  if (!result.success) {
    console.error("autoFulfillDataOrder failed:", dataOrderId, result.error);
  }
  return result;
}

async function fulfillSwiftOrder(admin: SupabaseClient, orderId: string): Promise<FulfillSuccess | FulfillFailure> {
  const swiftKey = Deno.env.get("SWIFTDATA_API_KEY");
  if (!swiftKey) {
    return { success: false, error: "SWIFTDATA_API_KEY not configured", status: 500 };
  }

  const { data: order, error: orderErr } = await admin
    .from("data_orders")
    .select("*, data_packages(swift_package_id, size_gb, network)")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return { success: false, error: "Order not found", status: 404 };
  }

  if (order.status === "completed" && order.provider_order_id) {
    return {
      success: true,
      order_id: orderId,
      status: order.status,
      provider_order_id: order.provider_order_id,
      provider_status: order.provider_status,
      fulfillment_provider: "swiftdata",
    };
  }

  const pkg = order.data_packages as { swift_package_id?: string; size_gb: number; network: string } | null;
  if (!pkg) {
    return { success: false, error: "Linked package not found", status: 400 };
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
      fulfillment_provider: "swiftdata",
    }).eq("id", orderId);
    return { success: false, error: "No matching provider plan for this bundle", status: 422 };
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
      fulfillment_provider: "swiftdata",
    }).eq("id", orderId);
    return {
      success: false,
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
    fulfillment_provider: "swiftdata",
  }).eq("id", orderId);

  if (!pkg.swift_package_id && order.package_id) {
    await admin.from("data_packages").update({ swift_package_id: swiftPackageId }).eq("id", order.package_id);
  }

  return {
    success: true,
    order_id: orderId,
    status: mappedStatus,
    provider_order_id: swiftRes.order_id ?? null,
    provider_status: swiftRes.status ?? null,
    fulfillment_provider: "swiftdata",
  };
}

async function fulfillDatamaxOrder(admin: SupabaseClient, orderId: string): Promise<FulfillSuccess | FulfillFailure> {
  const datamaxKey = Deno.env.get("DATAMAX_API_KEY");
  if (!datamaxKey) {
    return { success: false, error: "DATAMAX_API_KEY not configured", status: 500 };
  }

  const { data: order, error: orderErr } = await admin
    .from("data_orders")
    .select("*, data_packages(size_gb, network)")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return { success: false, error: "Order not found", status: 404 };
  }

  if (order.status === "completed" && order.provider_order_id) {
    return {
      success: true,
      order_id: orderId,
      status: order.status,
      provider_order_id: order.provider_order_id,
      provider_status: order.provider_status,
      fulfillment_provider: "datamax",
    };
  }

  const datamaxNetwork = mapBytebossNetworkToDatamax(order.network);
  if (!datamaxNetwork) {
    await admin.from("data_orders").update({
      status: "failed",
      provider_error: `Network ${order.network} is not supported on Datamax`,
      fulfillment_provider: "datamax",
    }).eq("id", orderId);
    return { success: false, error: "Network not supported on Datamax", status: 422 };
  }

  const volume = formatDatamaxVolume(order.size_gb);
  const datamaxRes = await placeDatamaxOrder(datamaxKey, {
    request_id: datamaxRequestId(orderId),
    network: datamaxNetwork,
    volume,
    customer_number: order.recipient_phone,
    quantity: 1,
  });

  if (!isDatamaxPlaceSuccess(datamaxRes) || datamaxRes.http_status >= 400) {
    const errMsg = datamaxRes.message || datamaxRes.error || "Datamax purchase failed";
    await admin.from("data_orders").update({
      status: "failed",
      provider_error: errMsg,
      provider_status: "failed",
      fulfillment_provider: "datamax",
    }).eq("id", orderId);
    return { success: false, error: errMsg, status: datamaxRes.http_status >= 400 ? datamaxRes.http_status : 502 };
  }

  const providerOrderId = datamaxRes.order_id != null ? String(datamaxRes.order_id) : null;
  let providerStatus = datamaxRes.message ?? "placed";
  let mappedStatus = mapDatamaxStatusToOrder(providerStatus);

  if (providerOrderId) {
    const statusRes = await fetchDatamaxOrderStatus(datamaxKey, providerOrderId);
    if (statusRes.success && statusRes.status) {
      providerStatus = statusRes.status_label ?? statusRes.status;
      mappedStatus = mapDatamaxStatusToOrder(statusRes.status);
    }
  }

  await admin.from("data_orders").update({
    status: mappedStatus,
    provider_order_id: providerOrderId,
    provider_status: providerStatus,
    provider_error: null,
    fulfillment_provider: "datamax",
  }).eq("id", orderId);

  return {
    success: true,
    order_id: orderId,
    status: mappedStatus,
    provider_order_id: providerOrderId,
    provider_status: providerStatus,
    fulfillment_provider: "datamax",
  };
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
