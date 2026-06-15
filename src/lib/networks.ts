import { labelFor } from "@/components/data/BuyDataDialog";

/** Canonical network order — MTN always first. */
export const NETWORK_ORDER = [
  "mtn",
  "airteltigo_ishare",
  "airteltigo_bigtime",
  "telecel",
] as const;

export type NetworkId = (typeof NETWORK_ORDER)[number];

export function networkSortIndex(network: string) {
  const i = NETWORK_ORDER.indexOf(network as NetworkId);
  return i === -1 ? NETWORK_ORDER.length : i;
}

export function sortByNetworkThenSize<T extends { network: string; size_gb: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const net = networkSortIndex(a.network) - networkSortIndex(b.network);
    if (net !== 0) return net;
    return Number(a.size_gb) - Number(b.size_gb);
  });
}

export function groupByNetwork<T extends { network: string }>(items: T[]): { network: string; label: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!map.has(item.network)) map.set(item.network, []);
    map.get(item.network)!.push(item);
  }
  return NETWORK_ORDER
    .filter(n => map.has(n))
    .map(network => ({
      network,
      label: labelFor(network),
      items: sortByNetworkThenSize(map.get(network)!),
    }));
}

export function networksPresent<T extends { network: string }>(items: T[]): string[] {
  const set = new Set(items.map(i => i.network));
  return NETWORK_ORDER.filter(n => set.has(n));
}

export const NETWORK_OPTIONS = NETWORK_ORDER.map(id => ({ id, label: labelFor(id) }));
