import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isPasskeySupported, setPasskeyHint } from "@/lib/passkey";

export type PasskeyItem = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

export function usePasskeyManagement() {
  const supported = isPasskeySupported();
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supported) {
      setPasskeys([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.passkey.list();
    if (!error && data) {
      setPasskeys(data);
      setPasskeyHint(data.length > 0);
    }
    setLoading(false);
  }, [supported]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const register = useCallback(async () => {
    const { error } = await supabase.auth.registerPasskey();
    if (error) throw error;
    setPasskeyHint(true);
    await refresh();
  }, [refresh]);

  const remove = useCallback(
    async (passkeyId: string) => {
      const { error } = await supabase.auth.passkey.delete({ passkeyId });
      if (error) throw error;
      const { data } = await supabase.auth.passkey.list();
      setPasskeyHint((data?.length ?? 0) > 0);
      await refresh();
    },
    [refresh],
  );

  return { passkeys, loading, supported, register, remove, refresh };
}
