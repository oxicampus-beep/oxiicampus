import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, TrendingDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SavingsExample = {
  sizeGb: number;
  network: string;
  userPrice: number;
  agentPrice: number;
  saved: number;
  pct: number;
};

const DISMISS_KEY = "byteboss_agent_banner_dismissed";

function networkLabel(network: string) {
  if (network.startsWith("airteltigo")) return "AirtelTigo";
  if (network === "telecel") return "Telecel";
  return "MTN";
}

type Props = {
  compact?: boolean;
  className?: string;
};

export default function AgentUpgradeBanner({ compact, className }: Props) {
  const [example, setExample] = useState<SavingsExample | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === "1");

  useEffect(() => {
    supabase
      .from("data_packages")
      .select("network, size_gb, user_price, agent_price")
      .eq("active", true)
      .then(({ data }) => {
        let best: SavingsExample | null = null;
        for (const p of data ?? []) {
          const user = Number(p.user_price);
          const agent = Number(p.agent_price);
          if (user <= agent) continue;
          const saved = user - agent;
          const pct = Math.round((saved / user) * 100);
          if (!best || saved > best.saved) {
            best = {
              sizeGb: Number(p.size_gb),
              network: p.network,
              userPrice: user,
              agentPrice: agent,
              saved,
              pct,
            };
          }
        }
        setExample(best);
      });
  }, []);

  if (dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent text-xs sm:text-sm",
          className,
        )}
      >
        <TrendingDown className="h-4 w-4 text-amber-400 shrink-0 hidden sm:block" />
        <p className="flex-1 min-w-0 text-muted-foreground">
          <span className="text-foreground font-semibold">Agents get cheaper data.</span>
          {example ? (
            <> Save up to ₵{example.saved.toFixed(2)} ({example.pct}%) per bundle.</>
          ) : (
            <> Unlock wholesale pricing on every network.</>
          )}
        </p>
        <Button asChild size="sm" className="h-8 shrink-0 font-bold text-xs gap-1.5">
          <Link to="/dashboard/my-store">
            <Store className="h-3.5 w-3.5" />
            Become Agent
          </Link>
        </Button>
        <button
          type="button"
          onClick={dismiss}
          className="h-7 w-7 shrink-0 rounded-lg hover:bg-white/10 grid place-items-center text-muted-foreground"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-primary/5 to-transparent p-5 sm:p-6 overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-3 right-3 h-8 w-8 rounded-lg hover:bg-white/10 grid place-items-center text-muted-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-8">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/20 grid place-items-center shrink-0">
          <TrendingDown className="h-7 w-7 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-black text-lg">You&apos;re paying user prices</h3>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold">Save with Agent</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {example ? (
              <>
                Agents pay <span className="text-primary font-bold">₵{example.agentPrice.toFixed(2)}</span> for{" "}
                {example.sizeGb}GB {networkLabel(example.network)} — you pay ₵{example.userPrice.toFixed(2)}.
                That&apos;s <span className="text-amber-400 font-bold">₵{example.saved.toFixed(2)} saved</span> per bundle.
              </>
            ) : (
              <>Create a free store and unlock wholesale agent pricing on MTN, Telecel, and AirtelTigo.</>
            )}
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0 font-black gap-2 shadow-lg shadow-primary/20">
          <Link to="/dashboard/my-store">
            <Store className="h-5 w-5" />
            Become an Agent
          </Link>
        </Button>
      </div>
    </div>
  );
}
