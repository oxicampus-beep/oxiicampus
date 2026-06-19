import { Link } from "react-router-dom";
import { Smartphone, Wifi, Radio, Phone, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPageHeader, GlassCard } from "@/components/dashboard/DashboardUi";
import AgentUpgradeBanner from "@/components/dashboard/AgentUpgradeBanner";
import { useDashboardRole } from "@/hooks/useDashboardRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const networks = [
  {
    label: "MTN",
    desc: "Instant delivery to any MTN number",
    to: "/dashboard/buy-data/mtn",
    icon: Smartphone,
    color: "from-amber-500/25 to-amber-600/5 border-amber-500/40 text-amber-300 hover:shadow-amber-500/20",
  },
  {
    label: "Telecel",
    desc: "Bundles for Telecel lines",
    to: "/dashboard/buy-data/telecel",
    icon: Wifi,
    color: "from-red-500/25 to-red-600/5 border-red-500/40 text-red-300 hover:shadow-red-500/20",
  },
  {
    label: "AirtelTigo",
    desc: "AT & BigTime bundles",
    to: "/dashboard/buy-data/airteltigo",
    icon: Radio,
    color: "from-indigo-500/25 to-indigo-600/5 border-indigo-500/40 text-indigo-300 hover:shadow-indigo-500/20",
  },
];

export default function BuyDataHub() {
  const { showAgentNav, isSubAgent } = useDashboardRole();

  return (
    <div className="space-y-6 md:space-y-8">
      <DashboardPageHeader
        title="Buy Data"
        description="Choose your network, pick a bundle, and we'll deliver in seconds."
        badge="Quick Buy"
      />

      {!showAgentNav && <AgentUpgradeBanner />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {networks.map(n => (
          <Link
            key={n.to}
            to={n.to}
            className={cn(
              "group relative flex flex-col gap-4 p-6 rounded-2xl border bg-gradient-to-br transition-all duration-200",
              "hover:-translate-y-1 hover:shadow-xl",
              n.color,
            )}
          >
            <div className="flex items-start justify-between">
              <div className="h-14 w-14 rounded-2xl bg-black/25 grid place-items-center group-hover:scale-110 transition-transform">
                <n.icon className="h-7 w-7" />
              </div>
              <ArrowRight className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <p className="font-display font-black text-2xl text-white">{n.label}</p>
              <p className="text-sm text-white/55 mt-1">{n.desc}</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-white/70 group-hover:text-white">
              Tap to buy →
            </span>
          </Link>
        ))}
      </div>

      <GlassCard title="More top-ups">
        <Link
          to="/dashboard/buy-airtime"
          className="flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-primary/30 hover:bg-white/5 transition-colors"
        >
          <div className="h-11 w-11 rounded-xl bg-primary/15 grid place-items-center">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold">Buy Airtime</p>
            <p className="text-xs text-muted-foreground">Top up any network from your wallet</p>
          </div>
          <Badge variant="outline" className="text-[9px]">New</Badge>
        </Link>
      </GlassCard>

      {showAgentNav && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-emerald-300">
              {isSubAgent ? "You're on sub-agent wholesale pricing" : "You're on agent wholesale pricing"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              View your rates on the{" "}
              <Link to="/dashboard/agent-prices" className="text-primary font-semibold hover:underline">
                My Prices
              </Link>{" "}
              page.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 border-emerald-500/30">
            <Link to="/dashboard/agent-prices">View my prices</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
