import { supabase } from "@/integrations/supabase/client";

export async function fulfillDataOrder(orderId: string) {
  const { data, error } = await supabase.functions.invoke("fulfill-data-order", {
    body: { order_id: orderId },
  });

  if (error) {
    throw new Error(error.message ?? "Could not deliver data");
  }
  if (!data?.success) {
    throw new Error(data?.error ?? "Data delivery failed");
  }
  return data as {
    success: boolean;
    status?: string;
    fulfillment_provider?: string;
    provider_order_id?: string | null;
  };
}

export async function fulfillDataOrders(orderIds: string[]) {
  const results = await Promise.allSettled(orderIds.map((id) => fulfillDataOrder(id)));
  const fulfilled = results.filter((r) => r.status === "fulfilled").length;
  return { fulfilled, total: orderIds.length, results };
}
