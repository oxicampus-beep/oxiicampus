import { authenticateApiKey, getRoutePath, NETWORK_LABELS, type ApiAuth } from "../_shared/byteboss-api.ts";
import { adminClient, fulfillOrder } from "../_shared/fulfill-order.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const API_VERSION = "1.0.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = adminClient();
  const path = getRoutePath(req);
  const method = req.method;

  try {
    if (path === "/" || path === "") {
      return json({
        success: true,
        name: "ByteBoss API",
        version: API_VERSION,
        docs: "https://byteboss.shop/api-docs",
        base_url: "https://byteboss.shop/api/v1",
      });
    }

    if (path === "/health") {
      return json({ success: true, status: "ok", version: API_VERSION });
    }

    const { auth, error: authError } = await authenticateApiKey(admin, req);
    if (!auth) return json({ success: false, error: authError }, 401);

    if (path === "/account" && method === "GET") return handleAccount(admin, auth);
    if (path === "/balance" && method === "GET") return handleBalance(admin, auth);
    if (path === "/plans" && method === "GET") return handlePlans(admin, auth);
    if (path === "/orders" && method === "GET") return handleOrders(admin, auth, req);
    if (path === "/data" && method === "POST") return handlePurchase(admin, auth, req);

    const orderMatch = path.match(/^\/orders\/([0-9a-f-]{36})$/i);
    if (orderMatch && method === "GET") {
      return handleOrderById(admin, auth, orderMatch[1]);
    }

    return json({ success: false, error: "Endpoint not found", path }, 404);
  } catch (e) {
    console.error(e);
    return json({ success: false, error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});

async function handleAccount(admin: ReturnType<typeof adminClient>, auth: ApiAuth) {
  const [{ data: profile }, { data: store }] = await Promise.all([
    admin.from("profiles").select("id, full_name, email, phone, wallet_balance, created_at").eq("id", auth.userId).single(),
    admin.from("stores").select("id, name, slug, active").eq("user_id", auth.userId).eq("active", true).maybeSingle(),
  ]);

  if (!profile) return json({ success: false, error: "Profile not found" }, 404);

  return json({
    success: true,
    account: {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      wallet_balance: Number(profile.wallet_balance),
      is_agent: !!store,
      store: store ? { name: store.name, slug: store.slug, url: `https://byteboss.shop/store/${store.slug}` } : null,
      created_at: profile.created_at,
    },
  });
}

async function handleBalance(admin: ReturnType<typeof adminClient>, auth: ApiAuth) {
  const { data: profile } = await admin
    .from("profiles")
    .select("wallet_balance")
    .eq("id", auth.userId)
    .single();

  if (!profile) return json({ success: false, error: "Profile not found" }, 404);

  return json({
    success: true,
    balance: Number(profile.wallet_balance),
    currency: "GHS",
  });
}

async function handlePlans(admin: ReturnType<typeof adminClient>, auth: ApiAuth) {
  const isAgent = await checkIsAgent(admin, auth.userId);
  const { data: packages, error } = await admin
    .from("data_packages")
    .select("id, network, size_gb, user_price, agent_price, validity")
    .eq("active", true)
    .order("network")
    .order("size_gb");

  if (error) return json({ success: false, error: error.message }, 500);

  const plans = (packages ?? []).map((p) => ({
    package_id: p.id,
    network: p.network,
    network_label: NETWORK_LABELS[p.network] ?? p.network,
    size_gb: Number(p.size_gb),
    price: Number(isAgent ? p.agent_price : p.user_price),
    validity: p.validity,
  }));

  return json({ success: true, plans, count: plans.length });
}

async function handleOrders(admin: ReturnType<typeof adminClient>, auth: ApiAuth, req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
  const status = url.searchParams.get("status");

  let query = admin
    .from("data_orders")
    .select("id, network, size_gb, price, recipient_phone, status, provider_order_id, provider_status, created_at, updated_at", { count: "exact" })
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) return json({ success: false, error: error.message }, 500);

  return json({
    success: true,
    orders: (data ?? []).map(formatOrder),
    pagination: { limit, offset, total: count ?? 0 },
  });
}

async function handleOrderById(admin: ReturnType<typeof adminClient>, auth: ApiAuth, orderId: string) {
  const { data, error } = await admin
    .from("data_orders")
    .select("id, network, size_gb, price, recipient_phone, status, provider_order_id, provider_status, provider_error, provider_reference, created_at, updated_at")
    .eq("id", orderId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) return json({ success: false, error: error.message }, 500);
  if (!data) return json({ success: false, error: "Order not found" }, 404);

  return json({ success: true, order: formatOrder(data) });
}

async function handlePurchase(admin: ReturnType<typeof adminClient>, auth: ApiAuth, req: Request) {
  const body = await req.json().catch(() => ({}));
  const packageId = body.package_id;
  const phone = String(body.phone ?? "").trim();

  if (!packageId) return json({ success: false, error: "package_id is required" }, 400);
  if (phone.length < 10) return json({ success: false, error: "Valid phone number is required (e.g. 0241234567)" }, 400);

  const { data: orderId, error } = await admin.rpc("api_purchase_data_package", {
    p_user_id: auth.userId,
    p_package_id: packageId,
    p_recipient_phone: phone,
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("Insufficient")) return json({ success: false, error: "Insufficient wallet balance" }, 402);
    if (msg.includes("not found") || msg.includes("inactive")) return json({ success: false, error: msg }, 404);
    return json({ success: false, error: msg }, 400);
  }

  const fulfillment = await fulfillOrder(admin, orderId as string);

  const { data: order } = await admin
    .from("data_orders")
    .select("id, network, size_gb, price, recipient_phone, status, provider_order_id, provider_status, created_at")
    .eq("id", orderId)
    .single();

  if (!fulfillment.success) {
    return json({
      success: true,
      message: "Order created but delivery is pending",
      order: order ? formatOrder(order) : { order_id: orderId },
      fulfillment_error: fulfillment.error,
    }, 202);
  }

  return json({
    success: true,
    order: formatOrder({
      ...order,
      status: fulfillment.status,
      provider_order_id: fulfillment.provider_order_id,
      provider_status: fulfillment.provider_status,
    }),
  }, 201);
}

async function checkIsAgent(admin: ReturnType<typeof adminClient>, userId: string) {
  const { data } = await admin
    .from("stores")
    .select("id")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  return !!data;
}

function formatOrder(row: Record<string, unknown>) {
  return {
    order_id: row.id,
    network: row.network,
    network_label: NETWORK_LABELS[String(row.network)] ?? row.network,
    size_gb: Number(row.size_gb),
    price: Number(row.price),
    recipient_phone: row.recipient_phone,
    status: row.status,
    provider_order_id: row.provider_order_id ?? null,
    provider_status: row.provider_status ?? null,
    provider_error: row.provider_error ?? null,
    reference: row.provider_reference ?? row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
