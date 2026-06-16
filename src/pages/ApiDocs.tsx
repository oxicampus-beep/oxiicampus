import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink, Key, Zap } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = "https://byteboss.shop/api/v1";

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  auth: boolean;
  body?: string;
  response?: string;
};

const ENDPOINTS: Endpoint[] = [
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
    description: "Your ByteBoss account details, wallet balance, and agent store info if applicable.",
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
    description: "Quick wallet balance lookup in Ghana Cedis (GHS).",
    auth: true,
    response: `{ "success": true, "balance": 150.00, "currency": "GHS" }`,
  },
  {
    method: "GET",
    path: "/plans",
    title: "Data packages",
    description: "List all active data bundles. Price reflects your account type (user or agent).",
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
    description: "Buy a data bundle for a recipient phone number. Deducts from your wallet and delivers instantly via our network partners.",
    auth: true,
    body: `{
  "package_id": "your-package-uuid",
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
    description: "Paginated list of your data orders. Optional query: ?status=completed&limit=20&offset=0",
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
    description: "Check a single order by its ByteBoss order ID.",
    auth: true,
    response: `{ "success": true, "order": { ... } }`,
  },
];

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-secondary/80 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">{text}</pre>
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-80"
        onClick={copy}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <Badge variant={method === "POST" ? "default" : "secondary"} className="font-mono text-xs shrink-0">
      {method}
    </Badge>
  );
}

export default function ApiDocs() {
  const sampleKey = "bb_live_your_api_key_here";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center font-black text-primary-foreground">B</div>
            <span className="font-display font-bold text-lg">ByteBoss API</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/api-docs">Docs</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/dashboard/developer">Get API Key</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Developer API v1</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            ByteBoss Data API
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Integrate MTN, AirtelTigo, and Telecel data bundles into your website or app.
            Purchases are deducted from your ByteBoss wallet and delivered instantly.
          </p>
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="text-sm text-muted-foreground mb-1">Base URL</div>
            <code className="text-base font-mono font-semibold text-primary">{BASE_URL}</code>
          </Card>
        </section>

        <section className="space-y-4" id="authentication">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Key className="h-6 w-6" /> Authentication
          </h2>
          <p className="text-muted-foreground">
            Generate an API key from your{" "}
            <Link to="/dashboard/developer" className="text-primary underline font-medium">Developer API</Link>{" "}
            dashboard. Include it on every authenticated request using either header:
          </p>
          <CopyBlock text={`Authorization: Bearer ${sampleKey}\n# or\nX-API-Key: ${sampleKey}`} />
          <p className="text-sm text-muted-foreground">
            Keep your API key secret. Never expose it in client-side JavaScript — proxy requests through your own backend.
          </p>
        </section>

        <section className="space-y-4" id="quickstart">
          <h2 className="text-2xl font-display font-bold">Quick start</h2>
          <CopyBlock text={`curl -X GET "${BASE_URL}/balance" \\
  -H "Authorization: Bearer ${sampleKey}"`} />
          <CopyBlock text={`curl -X POST "${BASE_URL}/data" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"package_id": "PACKAGE_UUID", "phone": "0241234567"}'`} />
        </section>

        <section className="space-y-4" id="networks">
          <h2 className="text-2xl font-display font-bold">Networks</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { id: "mtn", label: "MTN" },
              { id: "airteltigo_ishare", label: "AirtelTigo iShare" },
              { id: "airteltigo_bigtime", label: "AirtelTigo BigTime" },
              { id: "telecel", label: "Telecel" },
            ].map(n => (
              <Card key={n.id} className="p-3 flex justify-between items-center">
                <span className="font-medium">{n.label}</span>
                <code className="text-xs text-muted-foreground">{n.id}</code>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4" id="errors">
          <h2 className="text-2xl font-display font-bold">Error codes</h2>
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold">HTTP</th>
                  <th className="text-left p-3 font-semibold">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  ["401", "Missing or invalid API key"],
                  ["402", "Insufficient wallet balance"],
                  ["404", "Package or order not found"],
                  ["422", "Provider plan not available"],
                  ["502", "Provider delivery failed (order marked failed, wallet already charged — contact support)"],
                ].map(([code, msg]) => (
                  <tr key={code}>
                    <td className="p-3 font-mono">{code}</td>
                    <td className="p-3 text-muted-foreground">{msg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        <section className="space-y-6" id="endpoints">
          <h2 className="text-2xl font-display font-bold">Endpoints</h2>
          {ENDPOINTS.map(ep => (
            <Card key={ep.path + ep.method} className="p-6 space-y-4" id={ep.path.replace(/\//g, "-").replace(/[{}]/g, "")}>
              <div className="flex flex-wrap items-center gap-3">
                <MethodBadge method={ep.method} />
                <code className="font-mono text-sm font-semibold">{BASE_URL}{ep.path}</code>
                {ep.auth ? (
                  <Badge variant="outline" className="text-xs">Auth required</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Public</Badge>
                )}
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">{ep.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{ep.description}</p>
              </div>
              {ep.body && (
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Request body</div>
                  <CopyBlock text={ep.body} />
                </div>
              )}
              {ep.response && (
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Response</div>
                  <CopyBlock text={ep.response} />
                </div>
              )}
              {ep.auth && (
                <CopyBlock text={`curl -X ${ep.method} "${BASE_URL}${ep.path.replace("{order_id}", "ORDER_UUID")}" \\
  -H "Authorization: Bearer ${sampleKey}"${ep.method === "POST" ? ` \\
  -H "Content-Type: application/json" \\
  -d '${ep.body?.replace(/\n/g, " ").trim()}'` : ""}`} />
              )}
            </Card>
          ))}
        </section>

        <section className="space-y-4 pb-16">
          <h2 className="text-2xl font-display font-bold">Order status values</h2>
          <div className="flex flex-wrap gap-2">
            {["processing", "completed", "failed", "pending", "refunded"].map(s => (
              <Badge key={s} variant="secondary" className="capitalize font-mono">{s}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            After purchasing, poll <code className="text-xs bg-secondary px-1 rounded">GET /orders/{"{order_id}"}</code> until status is <code className="text-xs bg-secondary px-1 rounded">completed</code>.
          </p>
          <Button asChild variant="outline" className="gap-2">
            <a href={BASE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Test API root
            </a>
          </Button>
        </section>
      </main>
    </div>
  );
}
