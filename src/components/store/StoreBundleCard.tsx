import { Clock } from "lucide-react";
import NetworkBadge, { shortNetworkLabel } from "@/components/store/NetworkBadge";
import { labelFor } from "@/components/data/BuyDataDialog";

type Pkg = {
  id: string;
  network: string;
  size_gb: number;
  price: number;
};

export default function StoreBundleCard({ pkg, onSelect }: { pkg: Pkg; onSelect: () => void }) {
  const bundleLabel = `${labelFor(pkg.network)} Bundle`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group text-left w-full rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 transition-all duration-200 hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
    >
      <NetworkBadge network={pkg.network} />

      <div className="mt-3 text-2xl sm:text-3xl font-display font-bold text-zinc-900">
        {pkg.size_gb}<span className="text-lg sm:text-xl font-bold">GB</span>
      </div>

      <p className="mt-1 text-sm text-zinc-500">{bundleLabel}</p>

      <div className="mt-4 flex items-end justify-between gap-2">
        <span className="text-xl sm:text-2xl font-bold text-zinc-900">
          GH₵ {Number(pkg.price).toFixed(2)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 shrink-0">
          <Clock className="h-3.5 w-3.5" />
          1–5 min
        </span>
      </div>
    </button>
  );
}

export function StoreNetworkSection({
  network,
  count,
  children,
}: {
  network: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <NetworkBadge network={network} className="text-xs px-2.5 py-1" />
        <h2 className="text-lg font-display font-bold text-zinc-900">
          {shortNetworkLabel(network)} · {count} bundle{count !== 1 ? "s" : ""}
        </h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {children}
      </div>
    </section>
  );
}
