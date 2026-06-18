import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminStatCard({
  label, value, sub, accent, icon: Icon, className,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn(
      "rounded-2xl border p-5 backdrop-blur-sm",
      accent
        ? "bg-amber-400/5 border-amber-400/20"
        : "bg-white/[0.03] border-white/10",
      className,
    )}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</span>
        {Icon && <Icon className={cn("h-4 w-4", accent ? "text-amber-400" : "text-white/30")} />}
      </div>
      <div className={cn("font-black text-2xl md:text-3xl", accent ? "text-amber-400" : "text-white")}>{value}</div>
      {sub && <p className="text-[11px] text-white/40 mt-1 font-medium">{sub}</p>}
    </div>
  );
}

export function AdminPageHeader({
  title, description, actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">{title}</h1>
        {description && <p className="text-white/45 mt-1 text-sm max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function AdminCard({ children, className, title }: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden", className)}>
      {title && (
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-bold text-white text-lg">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
