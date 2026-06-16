import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type ApiAuth = {
  userId: string;
  keyId: string;
  label: string;
};

export function extractApiKey(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (header?.startsWith("Bearer ")) {
    const key = header.slice(7).trim();
    if (key) return key;
  }
  const xKey = req.headers.get("X-API-Key")?.trim();
  return xKey || null;
}

export async function authenticateApiKey(
  admin: SupabaseClient,
  req: Request,
): Promise<{ auth?: ApiAuth; error?: string }> {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return { error: "Missing API key. Use Authorization: Bearer <key> or X-API-Key header." };
  }

  const { data, error } = await admin
    .from("api_keys")
    .select("id, user_id, label, active")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (error || !data) return { error: "Invalid API key" };
  if (!data.active) return { error: "API key is disabled" };

  return {
    auth: { userId: data.user_id, keyId: data.id, label: data.label },
  };
}

export function getRoutePath(req: Request): string {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("developer-api");
  const route = idx >= 0 ? parts.slice(idx + 1) : parts;
  return "/" + route.join("/");
}

export const NETWORK_LABELS: Record<string, string> = {
  mtn: "MTN",
  airteltigo_ishare: "AirtelTigo iShare",
  airteltigo_bigtime: "AirtelTigo BigTime",
  telecel: "Telecel",
};
