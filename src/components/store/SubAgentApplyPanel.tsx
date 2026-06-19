import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useStoreTheme } from "@/components/store/StoreThemeProvider";
import { cn } from "@/lib/utils";
import type { SubAgentStatus } from "@/hooks/useStoreSubAgent";

type Props = {
  storeSlug: string;
  storeName: string;
  status: SubAgentStatus;
  fee: number;
  canApply: boolean;
  isStoreOwner: boolean;
  applying: boolean;
  onApply: () => void;
  authHref?: string;
  showAuthLink?: boolean;
  className?: string;
};

export default function SubAgentApplyPanel({
  storeSlug,
  storeName,
  status,
  fee,
  canApply,
  isStoreOwner,
  applying,
  onApply,
  authHref,
  showAuthLink = true,
  className,
}: Props) {
  const { isDark } = useStoreTheme();
  const joinHref = authHref ?? `/store/${storeSlug}/sub-agent`;

  const card = cn(
    "rounded-2xl border p-6",
    isDark ? "border-white/10 bg-zinc-900/50" : "border-zinc-200 bg-white",
    className,
  );

  if (isStoreOwner) {
    return (
      <div className={card}>
        <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-zinc-500")}>
          You own this store. Share{" "}
          <Link to={joinHref} className="text-primary font-semibold hover:underline">
            your sub-agent signup link
          </Link>{" "}
          so others can join under you.
        </p>
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className={cn(card, "text-center border-emerald-500/30 bg-emerald-500/10")}>
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
        <p className={cn("font-bold text-lg", isDark ? "text-emerald-400" : "text-emerald-700")}>
          You&apos;re an active sub-agent under {storeName}
        </p>
        <p className={cn("text-sm mt-2", isDark ? "text-zinc-400" : "text-zinc-600")}>
          Open your dashboard to buy at wholesale rates and manage your store.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-5">
          <Button asChild>
            <Link to="/dashboard">Open dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard/my-store">My store</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className={cn(card, "text-center border-amber-500/30 bg-amber-500/10")}>
        <Clock className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <p className={cn("font-bold text-lg", isDark ? "text-amber-400" : "text-amber-700")}>
          Application pending approval
        </p>
        <p className={cn("text-sm mt-2", isDark ? "text-zinc-400" : "text-zinc-600")}>
          We&apos;ll notify you once an admin approves your sub-agent account. Then you can create your store for free.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (status === "rejected" || status === "suspended") {
    return (
      <div className={cn(card, "text-center")}>
        <XCircle className="h-10 w-10 text-zinc-400 mx-auto mb-3" />
        <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-zinc-500")}>
          Your sub-agent application was {status}. Contact support if you need help.
        </p>
      </div>
    );
  }

  if (canApply) {
    return (
      <div className={card}>
        <div className="flex items-start gap-4">
          <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0", isDark ? "bg-primary/15" : "bg-primary/10")}>
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-display font-bold text-lg", isDark ? "text-white" : "text-zinc-900")}>
              Ready to join {storeName}?
            </h3>
            <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-zinc-500")}>
              Submit your application to get cheaper prices and your own reseller store.
            </p>
            {fee > 0 && (
              <p className={cn("text-xs mt-2", isDark ? "text-zinc-500" : "text-zinc-400")}>
                Activation fee: ₵{fee.toFixed(2)} (deducted from wallet)
              </p>
            )}
            <Button onClick={onApply} disabled={applying} className="mt-4 gap-2 font-semibold">
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Submit application
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-start gap-4">
        <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0", isDark ? "bg-primary/15" : "bg-primary/10")}>
          <UserPlus className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-display font-bold text-lg", isDark ? "text-white" : "text-zinc-900")}>
            Become a sub-agent under {storeName}
          </h3>
          <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-zinc-500")}>
            Get cheaper wholesale prices and launch your own reseller store with a full dashboard.
          </p>
          {fee > 0 && (
            <p className={cn("text-xs mt-2", isDark ? "text-zinc-500" : "text-zinc-400")}>
              Activation fee: ₵{fee.toFixed(2)} after signup
            </p>
          )}
          {showAuthLink && (
            <Button asChild className="mt-4 gap-2 font-semibold">
              <Link to={joinHref}>
                <UserPlus className="h-4 w-4" />
                Sign up / Log in to apply
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
