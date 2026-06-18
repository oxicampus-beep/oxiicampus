import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardPageHeader({
  title, description, badge, actions,
}: {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight">{title}</h1>
          {badge && <Badge className="bg-primary text-primary-foreground font-bold uppercase text-[10px]">{badge}</Badge>}
        </div>
        {description && <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function DashStatCard({
  icon: Icon, label, value, sub, accent, to, className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  to?: string;
  className?: string;
}) {
  const inner = (
    <Card className={cn(
      "p-5 rounded-2xl border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all duration-200",
      accent && "border-primary/30 bg-gradient-to-br from-primary/10 to-transparent shadow-[0_0_30px_hsl(var(--primary)/0.08)]",
      to && "hover:border-primary/40 hover:-translate-y-0.5 cursor-pointer",
      className,
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "h-10 w-10 rounded-xl grid place-items-center shrink-0",
          accent ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-white/5 text-primary",
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl md:text-3xl font-display font-black">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export function GlassCard({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <Card className={cn("rounded-2xl border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 md:p-6", className)}>
      {title && <h2 className="font-display font-bold text-lg mb-4">{title}</h2>}
      {children}
    </Card>
  );
}
