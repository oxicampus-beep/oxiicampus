import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  mtn: "bg-[#FFCC00] text-black",
  telecel: "bg-[#E4002B] text-white",
  airteltigo_ishare: "bg-[#0066CC] text-white",
  airteltigo_bigtime: "bg-[#0066CC] text-white",
};

export function shortNetworkLabel(network: string) {
  if (network === "mtn") return "MTN";
  if (network === "telecel") return "Telecel";
  if (network.startsWith("airteltigo")) return "AirtelTigo";
  return network;
}

export default function NetworkBadge({ network, className }: { network: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        styles[network] ?? "bg-zinc-200 text-zinc-800",
        className,
      )}
    >
      {shortNetworkLabel(network)}
    </span>
  );
}
