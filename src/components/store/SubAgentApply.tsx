import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  storeSlug: string;
  storeName: string;
  className?: string;
};

export default function SubAgentApply({ storeSlug, storeName, className }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | null>(null);
  const [fee, setFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: settings }, { data: sub }] = await Promise.all([
        supabase.from("platform_settings").select("sub_agent_activation_fee").eq("id", 1).maybeSingle(),
        user
          ? supabase.from("sub_agents").select("status").eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setFee(Number(settings?.sub_agent_activation_fee ?? 0));
      setStatus(sub?.status ?? null);
      setLoading(false);
    })();
  }, [user]);

  const apply = async () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/store/${storeSlug}`)}`);
      return;
    }
    setApplying(true);
    const { error } = await supabase.rpc("apply_sub_agent", { p_parent_store_slug: storeSlug });
    setApplying(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted! You'll get full access once approved.");
    setStatus("pending");
  };

  if (loading) return null;
  if (status === "active") {
    return (
      <div className={cn("rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center", className)}>
        <p className="font-semibold text-emerald-700 dark:text-emerald-400">You're an active sub-agent under {storeName}</p>
        <Button asChild className="mt-4" size="sm">
          <Link to="/dashboard">Open sub-agent dashboard</Link>
        </Button>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className={cn("rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center", className)}>
        <p className="font-semibold text-amber-800 dark:text-amber-400">Application pending approval</p>
        <p className="text-sm text-muted-foreground mt-1">We'll notify you when an admin approves your sub-agent account.</p>
      </div>
    );
  }
  if (status === "rejected" || status === "suspended") {
    return (
      <div className={cn("rounded-2xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-900/50 p-6 text-center", className)}>
        <p className="text-sm text-muted-foreground">Your sub-agent application was {status}.</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-primary/30 bg-primary/5 p-6", className)}>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/15 grid place-items-center shrink-0">
          <UserPlus className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg">Become a sub-agent</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Resell data under {storeName}. Get your own store, dashboard, and API — same tools as agents, without recruiting others.
          </p>
          {fee > 0 && (
            <p className="text-xs text-muted-foreground mt-2">Activation fee: ₵{fee.toFixed(2)} (deducted from wallet)</p>
          )}
          <Button onClick={apply} disabled={applying} className="mt-4 gap-2 font-semibold">
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {user ? "Apply now" : "Log in to apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
