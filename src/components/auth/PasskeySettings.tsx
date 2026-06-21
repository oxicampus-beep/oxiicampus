import { useState } from "react";
import { Fingerprint, Loader2, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/dashboard/DashboardUi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePasskeyManagement } from "@/hooks/usePasskey";
import { friendlyPasskeyError } from "@/lib/passkey";

export default function PasskeySettings() {
  const { passkeys, loading, supported, register, remove } = usePasskeyManagement();
  const [busy, setBusy] = useState(false);

  if (!supported) return null;

  const handleRegister = async () => {
    setBusy(true);
    try {
      await register();
      toast.success("Biometric sign-in added");
    } catch (e) {
      toast.error(friendlyPasskeyError(e as { message?: string; name?: string }));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    setBusy(true);
    try {
      await remove(id);
      toast.success("Biometric sign-in removed");
    } catch (e) {
      toast.error(friendlyPasskeyError(e as { message?: string; name?: string }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
          <Fingerprint className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold">Biometric sign-in</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Use fingerprint, Face ID, or your device PIN for faster sign-in.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading passkeys…
        </p>
      ) : passkeys.length > 0 ? (
        <ul className="space-y-2">
          {passkeys.map(pk => (
            <li
              key={pk.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{pk.friendly_name || "This device"}</p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(pk.created_at).toLocaleDateString()}
                  {pk.last_used_at ? ` · Last used ${new Date(pk.last_used_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={busy}
                onClick={() => handleRemove(pk.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Remove biometric sign-in"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No biometric sign-in set up yet.</p>
      )}

      <Button type="button" variant="outline" disabled={busy} onClick={handleRegister} className="w-full gap-2">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
        {passkeys.length > 0 ? "Add another device" : "Set up biometric sign-in"}
      </Button>
    </GlassCard>
  );
}
