export const API_BASE_URL = "https://byteboss.shop/api/v1";

export const NETWORKS = [
  { id: "mtn", label: "MTN" },
  { id: "airteltigo_ishare", label: "AirtelTigo iShare" },
  { id: "airteltigo_bigtime", label: "AirtelTigo BigTime" },
  { id: "telecel", label: "Telecel" },
] as const;

export const ORDER_STATUSES = ["pending", "processing", "completed", "failed", "refunded"] as const;

export type DocEndpoint = {
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  auth: boolean;
  body?: string;
  response?: string;
};

export const ENDPOINTS: DocEndpoint[] = [
  {
    method: "GET",
    path: "/",
    title: "API info",
    description: "Returns API name, version, and documentation URL. No authentication required.",
    auth: false,
    response: `{
  "success": true,
  "name": "ByteBoss API",
  "version": "1.0.0",
  "docs": "https://byteboss.shop/api-docs",
  "base_url": "https://byteboss.shop/api/v1"
}`,
  },
  {
    method: "GET",
    path: "/health",
    title: "Health check",
    description: "Simple uptime check. No authentication required.",
    auth: false,
    response: `{ "success": true, "status": "ok", "version": "1.0.0" }`,
  },
  {
    method: "GET",
    path: "/account",
    title: "Account profile",
    description: "Returns your profile, wallet balance, and agent store info (if applicable).",
    auth: true,
    response: `{
  "success": true,
  "account": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "0241234567",
    "wallet_balance": 150.00,
    "is_agent": false,
    "store": null,
    "created_at": "2026-01-20T12:00:00Z"
  }
}`,
  },
  {
    method: "GET",
    path: "/balance",
    title: "Wallet balance",
    description: "Returns your current wallet balance in Ghana Cedis (GHS).",
    auth: true,
    response: `{ "success": true, "balance": 150.00, "currency": "GHS" }`,
  },
  {
    method: "GET",
    path: "/plans",
    title: "Data plans",
    description: "Lists all active data bundles with prices. Agents receive agent pricing automatically.",
    auth: true,
    response: `{
  "success": true,
  "count": 12,
  "plans": [
    {
      "package_id": "uuid",
      "network": "mtn",
      "network_label": "MTN",
      "size_gb": 5,
      "price": 22.50,
      "validity": "Non expiry"
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/data",
    title: "Purchase data",
    description: "Buy a data bundle for a recipient phone number. Deducts from your wallet and delivers instantly.",
    auth: true,
    body: `{
  "package_id": "uuid-from-plans-endpoint",
  "phone": "0241234567"
}`,
    response: `{
  "success": true,
  "order": {
    "order_id": "uuid",
    "network": "mtn",
    "network_label": "MTN",
    "size_gb": 5,
    "price": 22.50,
    "recipient_phone": "0241234567",
    "status": "completed",
    "provider_order_id": "provider-ref",
    "reference": "uuid",
    "created_at": "2026-06-16T12:00:00Z"
  }
}`,
  },
  {
    method: "GET",
    path: "/orders",
    title: "Order history",
    description: "Paginated list of your data orders. Optional query: limit (max 100), offset, status.",
    auth: true,
    response: `{
  "success": true,
  "orders": [ ... ],
  "pagination": { "limit": 20, "offset": 0, "total": 42 }
}`,
  },
  {
    method: "GET",
    path: "/orders/{order_id}",
    title: "Order status",
    description: "Get details for a single order by ID.",
    auth: true,
    response: `{ "success": true, "order": { ... } }`,
  },
];

export const CURL_EXAMPLES = {
  plans: `curl -X GET "${API_BASE_URL}/plans" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  purchase: `curl -X POST "${API_BASE_URL}/data" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"package_id":"PACKAGE_UUID","phone":"0241234567"}'`,
  balance: `curl -X GET "${API_BASE_URL}/balance" \\
  -H "X-API-Key: YOUR_API_KEY"`,
};

export const JS_EXAMPLE = `const API_KEY = "bb_live_your_key_here";
const BASE = "${API_BASE_URL}";

async function buyData(packageId, phone) {
  const res = await fetch(\`\${BASE}/data\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ package_id: packageId, phone }),
  });
  return res.json();
}`;

export const PYTHON_EXAMPLE = `import requests

API_KEY = "bb_live_your_key_here"
BASE = "${API_BASE_URL}"

def buy_data(package_id: str, phone: str):
    r = requests.post(
        f"{BASE}/data",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"package_id": package_id, "phone": phone},
        timeout=60,
    )
    r.raise_for_status()
    return r.json()`;
