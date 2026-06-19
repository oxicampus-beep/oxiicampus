import { Link } from "react-router-dom";
import { Store, TrendingDown, Zap, LayoutDashboard, Wallet } from "lucide-react";
import { useStoreTheme } from "@/components/store/StoreThemeProvider";
import { cn } from "@/lib/utils";
import type { SubAgentSavings } from "@/hooks/useStoreSubAgent";

const perks = [
  { icon: TrendingDown, title: "Cheaper wholesale prices", desc: "Buy data below public rates — prices set by your parent agent." },
  { icon: Store, title: "Your own reseller store", desc: "Launch a branded mini-store and sell bundles under your name." },
  { icon: LayoutDashboard, title: "Full reseller dashboard", desc: "Wallet, API access, marketing tools — same power as agents." },
  { icon: Wallet, title: "Earn on every sale", desc: "Set your sell prices and keep the profit from your customers." },
];

type Props = {
  storeName: string;
  savings?: SubAgentSavings | null;
  compact?: boolean;
  className?: string;
};

export default function SubAgentBenefits({ storeName, savings, compact, className }: Props) {
  const { isDark } = useStoreTheme();

  if (compact) {
    return (
      <ul className={cn("grid sm:grid-cols-2 gap-3 text-sm", className)}>
        {perks.map(p => (
          <li
            key={p.title}
            className={cn(
              "flex gap-3 p-3 rounded-xl border",
              isDark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-zinc-50",
            )}
          >
            <p.icon className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className={cn("font-semibold", isDark ? "text-white" : "text-zinc-900")}>{p.title}</p>
              <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-400" : "text-zinc-500")}>{p.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={className}>
      {savings && (
        <div
          className={cn(
            "rounded-2xl border p-4 mb-6 flex items-center gap-3",
            isDark ? "border-amber-500/30 bg-amber-500/10" : "border-amber-200 bg-amber-50",
          )}
        >
          <Zap className={cn("h-6 w-6 shrink-0", isDark ? "text-amber-400" : "text-amber-600")} />
          <p className={cn("text-sm", isDark ? "text-amber-100" : "text-amber-900")}>
            Sub-agents under {storeName} on <span className="font-bold">{savings.label}</span>: public price{" "}
            <span className="font-bold">₵{savings.userPrice.toFixed(2)}</span>, wholesale from{" "}
            <span className="font-bold">₵{savings.agentPrice.toFixed(2)}</span> — save{" "}
            <span className="font-bold">₵{savings.saved.toFixed(2)} ({savings.pct}%)</span> per order.
          </p>        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {perks.map(p => (
          <div
            key={p.title}
            className={cn(
              "p-5 rounded-2xl border",
              isDark ? "border-white/10 bg-zinc-900/50" : "border-zinc-200 bg-white",
            )}
          >
            <div className={cn("h-11 w-11 rounded-xl grid place-items-center mb-3", isDark ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary")}>
              <p.icon className="h-5 w-5" />
            </div>
            <h3 className={cn("font-bold", isDark ? "text-white" : "text-zinc-900")}>{p.title}</h3>
            <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-zinc-500")}>{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
