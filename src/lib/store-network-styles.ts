/** Network brand colors for agent store bundle cards */
export const storeNetworkCardStyles: Record<string, string> = {
  mtn: "border-mtn/50 bg-mtn text-mtn-foreground hover:border-mtn hover:shadow-[0_0_24px_hsl(var(--mtn)/0.45)]",
  telecel: "border-telecel/50 bg-telecel text-telecel-foreground hover:border-telecel hover:shadow-[0_0_24px_hsl(var(--telecel)/0.45)]",
  airteltigo_ishare: "border-airteltigo/50 bg-airteltigo text-airteltigo-foreground hover:border-airteltigo hover:shadow-[0_0_24px_hsl(var(--airteltigo)/0.45)]",
  airteltigo_bigtime: "border-airteltigo/50 bg-airteltigo text-airteltigo-foreground hover:border-airteltigo hover:shadow-[0_0_24px_hsl(var(--airteltigo)/0.45)]",
};

export function networkCardClass(network: string) {
  return storeNetworkCardStyles[network] ?? "border-zinc-400/50 bg-zinc-200 text-zinc-900";
}
