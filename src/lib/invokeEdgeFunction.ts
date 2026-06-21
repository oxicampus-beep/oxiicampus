import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export async function parseFunctionError(
  error: unknown,
  data: unknown,
): Promise<string> {
  if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
    return (data as { error: string }).error;
  }

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    } catch {
      /* ignore */
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export async function invokeEdgeFunction<T = Record<string, unknown>>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const { data, error } = await supabase.functions.invoke(name, { body, headers });

  if (error) {
    throw new Error(await parseFunctionError(error, data));
  }

  if (data && typeof data === "object" && (data as { success?: boolean }).success === false) {
    const msg = (data as { error?: string }).error ?? "Request failed";
    throw new Error(msg);
  }

  return data as T;
}
