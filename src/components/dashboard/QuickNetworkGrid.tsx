import { Link } from "react-router-dom";
import { Smartphone, Wifi, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const networks = [
  { label: "MTN", to: "/dashboard/buy-data/mtn", icon: Smartphone, color: "from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400" },
  { label: "Telecel", to: "/dashboard/buy-data/telecel", icon: Wifi, color: "from-red-500/20 to-red-600/5 border-red-500/30 text-red-400" },
  { label: "AirtelTigo", to: "/dashboard/buy-data/airteltigo", icon: Radio, color: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/30 text-indigo-400" },
];

export default function QuickNetworkGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {networks.map(n => (
        <Link
          key={n.to}
          to={n.to}
          className={cn(
            "group flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-br transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
            n.color,
          )}
        >
          <div className="h-11 w-11 rounded-xl bg-black/20 grid place-items-center shrink-0 group-hover:scale-110 transition-transform">
            <n.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-black text-white">{n.label}</p>
            <p className="text-xs text-white/50">Buy data bundle</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
